import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse, ClienteService } from '@app/services/cliente/cliente.service';
import { NotificationService } from '@app/services';

@Component({
  selector: 'app-edit-cliente-dialog',
  templateUrl: './edit-cliente-dialog.component.html',
  styleUrls: ['./edit-cliente-dialog.component.scss']
})
export class EditClienteDialogComponent implements OnInit {

  form!: FormGroup;
  guardando = false;

  tiposId = ['DNI / Identidad', 'Pasaporte'];
  sexos = ['Masculino', 'Femenino'];
  nacionalidades = [
    'Hondureño/a', 'Guatemalteco/a', 'Salvadoreño/a', 'Nicaragüense',
    'Costarricense', 'Beliceño/a', 'Panameño/a', 'Mexicano/a', 'Otro'
  ];
  departamentos = [
    'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés',
    'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá',
    'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
    'Santa Bárbara', 'Valle', 'Yoro'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteResponse,
    private clienteService: ClienteService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      primerNombre:       [this.data.nombres        || '', Validators.required],
      segundoNombre:      [this.data.segundoNombre  || ''],
      primerApellido:     [this.data.apellidos      || ''],
      segundoApellido:    [this.data.segundoApellido || ''],
      identidad:          [this.data.identidad],
      tipoIdentificacion: [this.data.tipoIdentificacion],
      sexo:               [this.data.sexo],
      fechaNacimiento:    [this.data.fechaNacimiento ? new Date(this.data.fechaNacimiento) : null],
      nacionalidad:       [this.data.nacionalidad],
      lugarNacimiento:    [this.data.lugarNacimiento || ''],
      departamento:       [this.data.departamento],
      municipio:          [this.data.municipio],
      direccion:          [this.data.direccion      || ''],
      telefono:           [this.data.telefono],
      correoElectronico:  [this.data.correoElectronico, Validators.email],
      rtn:                [this.data.rtn            || ''],
    });
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const f = this.form.value;

    const up = (v: string) => v ? v.toUpperCase() : undefined;

    this.clienteService.actualizarCliente({
      id:                 this.data.id,
      tipoIdentificacion: f.tipoIdentificacion  || undefined,
      identidad:          f.identidad            || undefined,
      primerNombre:       up(f.primerNombre),
      segundoNombre:      up(f.segundoNombre),
      primerApellido:     up(f.primerApellido),
      segundoApellido:    up(f.segundoApellido),
      nacionalidad:       f.nacionalidad         || undefined,
      sexo:               f.sexo                 || undefined,
      fechaNacimiento:    f.fechaNacimiento
                            ? new Date(f.fechaNacimiento).toISOString().split('T')[0]
                            : undefined,
      departamento:       f.departamento         || undefined,
      municipio:          up(f.municipio),
      telefono:           f.telefono             || undefined,
      correoElectronico:  f.correoElectronico    || undefined,
      direccion:          up(f.direccion),
      rtn:                f.rtn                  || undefined,
    }).subscribe({
      next: () => {
        this.notification.success('Cliente actualizado correctamente');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notification.error('Error al actualizar el cliente');
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
