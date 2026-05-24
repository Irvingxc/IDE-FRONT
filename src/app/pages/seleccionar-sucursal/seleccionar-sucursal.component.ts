import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

@Component({
  selector: 'app-seleccionar-sucursal',
  templateUrl: './seleccionar-sucursal.component.html',
  styleUrls: ['./seleccionar-sucursal.component.scss']
})
export class SeleccionarSucursalComponent implements OnInit {

  sucursales: { id: number; nombre: string }[] = [];
  cargando   = true;
  guardando  = false;

  constructor(
    private usuarioService: UsuarioService,
    private store: Store<fromRoot.State>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioService.getSucursales().subscribe({
      next: (s) => { this.sucursales = s; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  seleccionar(sucursalId: number): void {
    if (this.guardando) return;
    this.guardando = true;
    this.usuarioService.seleccionarSucursal(sucursalId).subscribe({
      next: (user) => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user_session', JSON.stringify(user));
        this.store.dispatch(new fromUser.InitAuthorized(user.email!, user));
        this.router.navigate(['/']);
      },
      error: () => { this.guardando = false; }
    });
  }
}
