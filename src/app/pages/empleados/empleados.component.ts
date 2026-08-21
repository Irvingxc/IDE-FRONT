import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService, UsuarioLista } from '@app/services/usuario/usuario.service';
import { RegistrarUsuarioDialogComponent } from './registrar-usuario-dialog/registrar-usuario-dialog.component';
import { EditarUsuarioDialogComponent } from './editar-usuario-dialog/editar-usuario-dialog.component';
import { GestionRolesDialogComponent } from './gestion-roles-dialog/gestion-roles-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss']
})
export class EmpleadosComponent implements OnInit {

  columns = ['nombre', 'username', 'email', 'telefono', 'rol', 'acciones'];
  usuarios: UsuarioLista[] = [];
  loading = false;

  filtroTipo: '' | 'empleados' | 'clientes' = '';

  get usuariosFiltrados(): UsuarioLista[] {
    if (this.filtroTipo === 'clientes')  return this.usuarios.filter(u => u.rol === 'Cliente');
    if (this.filtroTipo === 'empleados') return this.usuarios.filter(u => u.rol !== 'Cliente');
    return this.usuarios;
  }

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  registrar(): void {
    const ref = this.dialog.open(RegistrarUsuarioDialogComponent, {
      width: '620px',
      disableClose: true
    });
    ref.afterClosed().subscribe((registrado) => {
      if (registrado) this.cargarUsuarios();
    });
  }

  gestionarRoles(): void {
    this.dialog.open(GestionRolesDialogComponent, { width: '500px', disableClose: false });
  }

  editar(usuario: UsuarioLista): void {
    const ref = this.dialog.open(EditarUsuarioDialogComponent, {
      width: '620px',
      disableClose: true,
      data: usuario
    });
    ref.afterClosed().subscribe((actualizado) => {
      if (actualizado) this.cargarUsuarios();
    });
  }

  cambiarPassword(usuario: UsuarioLista): void {
    this.dialog.open(ResetPasswordDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { id: usuario.id, nombreCompleto: `${usuario.nombre} ${usuario.apellido}` }
    });
  }
}
