import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsuarioService, UsuarioLista } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services';

@Component({
  selector: 'app-editar-usuario-dialog',
  templateUrl: './editar-usuario-dialog.component.html',
  styleUrls: ['./editar-usuario-dialog.component.scss']
})
export class EditarUsuarioDialogComponent implements OnInit {

  form: FormGroup;
  guardando = false;
  roles: string[] = [];
  sucursales: { id: number; nombre: string }[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public usuario: UsuarioLista,
    public dialogRef: MatDialogRef<EditarUsuarioDialogComponent>,
    private usuarioService: UsuarioService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      nombre:     [usuario.nombre,    Validators.required],
      apellido:   [usuario.apellido,  Validators.required],
      username:   [usuario.username,  Validators.required],
      email:      [usuario.email,     [Validators.required, Validators.email]],
      telefono:   [usuario.telefono  ?? ''],
      rol:        [usuario.rol       ?? ''],
      sucursalId: [usuario.sucursalId ?? null],
      aula:       [usuario.aula      ?? ''],
    });
  }

  ngOnInit(): void {
    this.usuarioService.getRoles().subscribe(r => this.roles = r);
    this.usuarioService.getSucursales().subscribe(s => this.sucursales = s);
  }

  get esMaestro(): boolean {
    return this.form.get('rol')?.value === 'Maestro';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    this.usuarioService.editar(this.usuario.id, this.form.value).subscribe({
      next: () => {
        this.notification.success('Usuario actualizado correctamente');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notification.error('Error al actualizar el usuario');
        this.guardando = false;
      }
    });
  }
}
