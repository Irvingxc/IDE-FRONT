import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services';
import { PermisosRolDialogComponent } from '../permisos-rol-dialog/permisos-rol-dialog.component';

@Component({
  selector: 'app-gestion-roles-dialog',
  templateUrl: './gestion-roles-dialog.component.html',
  styleUrls: ['./gestion-roles-dialog.component.scss']
})
export class GestionRolesDialogComponent implements OnInit {

  roles: string[] = [];
  cargando = false;
  nuevoRol = '';
  editandoRol: string | null = null;
  nombreEditado = '';

  constructor(
    public dialogRef: MatDialogRef<GestionRolesDialogComponent>,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargando = true;
    this.usuarioService.getRoles().subscribe({
      next: (r) => { this.roles = r; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  agregar(): void {
    const nombre = this.nuevoRol.trim();
    if (!nombre) return;
    this.usuarioService.crearRol(nombre).subscribe({
      next: () => {
        this.notification.success(`Rol '${nombre}' creado`);
        this.nuevoRol = '';
        this.cargarRoles();
      },
      error: () => this.notification.error('Error al crear el rol')
    });
  }

  iniciarEdicion(rol: string): void {
    this.editandoRol   = rol;
    this.nombreEditado = rol;
  }

  cancelarEdicion(): void {
    this.editandoRol = null;
  }

  guardarEdicion(nombreActual: string): void {
    const nuevo = this.nombreEditado.trim();
    if (!nuevo || nuevo === nombreActual) { this.cancelarEdicion(); return; }
    this.usuarioService.renombrarRol(nombreActual, nuevo).subscribe({
      next: () => {
        this.notification.success(`Rol renombrado a '${nuevo}'`);
        this.editandoRol = null;
        this.cargarRoles();
      },
      error: () => this.notification.error('Error al renombrar el rol')
    });
  }

  eliminar(nombre: string): void {
    if (!confirm(`¿Eliminar el rol '${nombre}'? Los usuarios que lo tengan quedarán sin rol.`)) return;
    this.usuarioService.eliminarRol(nombre).subscribe({
      next: () => {
        this.notification.success(`Rol '${nombre}' eliminado`);
        this.cargarRoles();
      },
      error: () => this.notification.error('Error al eliminar el rol')
    });
  }

  verPermisos(rol: string): void {
    this.dialog.open(PermisosRolDialogComponent, {
      width: '480px',
      data: rol
    });
  }
}
