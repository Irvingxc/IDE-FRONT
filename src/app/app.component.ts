import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import * as fromRoot from './store';
import * as fromUser from './store/user';
import { SessionWarningDialogComponent } from './session-warning-dialog.component';
import { TokenService } from './services/token/token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  showSpinner = false;
  title = 'danli-ide';

  user$!: Observable<fromUser.UserResponse>;
  isAuthorized$!: Observable<boolean>;
  isLanding$!: Observable<boolean>;

  private avisoTimer?: ReturnType<typeof setTimeout>;
  private tokenSub?: Subscription;

  constructor(
    private notification: NotificationService,
    private store: Store<fromRoot.State>,
    private router: Router,
    private dialog: MatDialog,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.user$ = this.store.pipe(select(fromUser.getUser)) as Observable<fromUser.UserResponse>;
    this.isAuthorized$ = this.store.pipe(select(fromUser.getIsAuthorized)) as Observable<boolean>;
    const sinHeader = (url: string) =>
      url === '/' || url.startsWith('/portal-cliente') || url.startsWith('/activar-cuenta');

    this.isLanding$ = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => sinHeader(e.urlAfterRedirects || e.url)),
      startWith(sinHeader(this.router.url))
    );
    this.store.dispatch(new fromUser.Init());

    // token$ emite en login, en cada renovacion silenciosa y en logout (null).
    // Cada emision re-programa el aviso, asi el dialogo solo aparece cuando el
    // usuario lleva rato inactivo y el token ya no se renovo.
    this.tokenSub = this.tokenService.token$.subscribe(token => {
      if (token) {
        this.programarAvisoExpiracion(token);
      } else {
        this.cancelarAvisoTimer();
        this.dialog.closeAll();
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelarAvisoTimer();
    this.tokenSub?.unsubscribe();
  }

  private programarAvisoExpiracion(token: string): void {
    this.cancelarAvisoTimer();

    const msHastaAviso = this.tokenService.msParaExpirar(token) - 2 * 60 * 1000;
    if (msHastaAviso <= 0) return;

    this.avisoTimer = setTimeout(() => this.mostrarAviso(), msHastaAviso);
  }

  private mostrarAviso(): void {
    const ref = this.dialog.open(SessionWarningDialogComponent, {
      width: '380px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((cerrar: boolean) => {
      if (cerrar) {
        this.onSignOut();
      } else {
        // "Entendido" = actividad: renovar el token para extender la sesion.
        this.tokenService.renovarSiHaceFalta();
      }
    });
  }

  private cancelarAvisoTimer(): void {
    if (this.avisoTimer) {
      clearTimeout(this.avisoTimer);
      this.avisoTimer = undefined;
    }
  }

  onToggleSpinner(): void {
    this.showSpinner = !this.showSpinner;
  }

  onFilesChanged(urls: string | string[]): void {
    console.log(urls);
  }

  onSuccess(): void {
    this.notification.success('El procedimiento fue exitoso');
  }

  onError(): void {
    this.notification.error('Se encontraron errores en el proceso');
  }

  onSignOut(): void {
    this.cancelarAvisoTimer();
    this.dialog.closeAll();
    this.tokenService.clear();
    this.store.dispatch(new fromUser.SignOut());
    this.router.navigate(['/']);
  }
}
