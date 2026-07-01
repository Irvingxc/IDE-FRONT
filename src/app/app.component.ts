import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs/operators';
import * as fromRoot from './store';
import * as fromUser from './store/user';
import { SessionWarningDialogComponent } from './session-warning-dialog.component';

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
  private authSub?: Subscription;

  constructor(
    private notification: NotificationService,
    private store: Store<fromRoot.State>,
    private router: Router,
    private dialog: MatDialog
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

    this.authSub = this.isAuthorized$
      .pipe(distinctUntilChanged())
      .subscribe(isAuth => {
        if (isAuth) {
          this.programarAvisoExpiracion();
        } else {
          this.cancelarAvisoTimer();
        }
      });
  }

  ngOnDestroy(): void {
    this.cancelarAvisoTimer();
    this.authSub?.unsubscribe();
  }

  private programarAvisoExpiracion(): void {
    this.cancelarAvisoTimer();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return;

      const msHastaAviso = payload.exp * 1000 - Date.now() - 2 * 60 * 1000;
      if (msHastaAviso <= 0) return;

      this.avisoTimer = setTimeout(() => this.mostrarAviso(), msHastaAviso);
    } catch { return; }
  }

  private mostrarAviso(): void {
    const ref = this.dialog.open(SessionWarningDialogComponent, {
      width: '380px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((cerrar: boolean) => {
      if (cerrar) this.onSignOut();
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
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    this.store.dispatch(new fromUser.SignOut());
    this.router.navigate(['/']);
  }
}
