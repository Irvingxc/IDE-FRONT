import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsuarioService, ModuloDto } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services';

@Component({
  selector: 'app-permisos-rol-dialog',
  templateUrl: './permisos-rol-dialog.component.html',
  styleUrls: ['./permisos-rol-dialog.component.scss']
})
export class PermisosRolDialogComponent implements OnInit {

  modulos: ModuloDto[] = [];
  cargando  = false;
  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public rolNombre: string,
    public dialogRef: MatDialogRef<PermisosRolDialogComponent>,
    private usuarioService: UsuarioService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.usuarioService.getModulosDeRol(this.rolNombre).subscribe({
      next: (m) => { this.modulos = m; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  toggleTodos(seleccionar: boolean): void {
    this.modulos.forEach(m => m.seleccionado = seleccionar);
  }

  get todosSeleccionados(): boolean {
    return this.modulos.length > 0 && this.modulos.every(m => m.seleccionado);
  }

  get algunoSeleccionado(): boolean {
    return !this.todosSeleccionados && this.modulos.some(m => m.seleccionado);
  }

  toggleModulo(modulo: ModuloDto, checked: boolean): void {
    modulo.seleccionado = checked;
  }

  guardar(): void {
    this.guardando = true;
    const ids = this.modulos.filter(m => m.seleccionado).map(m => m.id);
    this.usuarioService.actualizarModulosDeRol(this.rolNombre, ids).subscribe({
      next: () => {
        this.notification.success('Permisos actualizados');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notification.error('Error al guardar permisos');
        this.guardando = false;
      }
    });
  }
}
