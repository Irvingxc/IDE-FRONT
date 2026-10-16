import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClienteResponse, ClienteService, NIVELES_EDUCATIVOS } from '@app/services/cliente/cliente.service';
import { NotificationService } from '@app/services';
import { PAISES_TELEFONO, PaisTelefono } from '../telefono-mask.directive';
import {
  LIMITES, correoValidator, fechaNacimientoValidator, identidadValidator, mensajeApi, mensajeError,
  nombreValidator, siCambia, telefonoCompletoValidator, texto, vincular,
} from '../validaciones-formulario';

@Component({
  selector: 'app-edit-cliente-dialog',
  templateUrl: './edit-cliente-dialog.component.html',
  styleUrls: ['./edit-cliente-dialog.component.scss']
})
export class EditClienteDialogComponent implements OnInit {

  form!: FormGroup;
  guardando = false;
  err = mensajeError;
  hoy = new Date();
  correoOriginal = '';
  confirmaCambioCorreo = false;
  /** La ficha solo se guarda si se pudo cargar (evita borrar datos por un error de red). */
  fichaCargada = false;
  nivelesEducativos = NIVELES_EDUCATIVOS;

  paises: PaisTelefono[] = PAISES_TELEFONO;
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

  get paisSeleccionado(): PaisTelefono {
    const codigo = this.form?.get('paisTelefono')?.value ?? '+504';
    return this.paises.find(p => p.codigo === codigo) ?? this.paises[0];
  }

  private parsearTelefono(telefono: string | null): { codigo: string; numero: string } {
    if (!telefono) return { codigo: '+504', numero: '' };
    const pais = this.paises.find(p => telefono.startsWith(p.codigo + ' '));
    if (pais) return { codigo: pais.codigo, numero: telefono.slice(pais.codigo.length + 1) };
    return { codigo: '+504', numero: telefono };
  }

  ngOnInit(): void {
    const tel = this.parsearTelefono(this.data.telefono ?? null);
    this.correoOriginal = (this.data.correoElectronico ?? '').trim();

    this.form = this.fb.group({
      // Nombres y Apellidos guardan los dos nombres (o apellidos) juntos: máximo 500 en la base (SQL 038).
      // Los formatos se validan solo si el usuario cambia el dato (hay datos viejos con otro formato).
      primerNombre:       [this.data.nombres        || '', [Validators.required, Validators.maxLength(LIMITES.nombresJuntos),
                                                           siCambia(this.data.nombres, nombreValidator)]],
      segundoNombre:      [this.data.segundoNombre  || ''],
      primerApellido:     [this.data.apellidos      || '', [Validators.maxLength(LIMITES.nombresJuntos),
                                                           siCambia(this.data.apellidos, nombreValidator)]],
      segundoApellido:    [this.data.segundoApellido || ''],
      identidad:          [this.data.identidad, siCambia(this.data.identidad, identidadValidator())],
      tipoIdentificacion: [this.data.tipoIdentificacion],
      sexo:               [this.data.sexo],
      fechaNacimiento:    [this.data.fechaNacimiento ? new Date(this.data.fechaNacimiento) : null, fechaNacimientoValidator(100)],
      nacionalidad:       [this.data.nacionalidad],
      lugarNacimiento:    [this.data.lugarNacimiento || ''],
      departamento:       [this.data.departamento],
      municipio:          [this.data.municipio, Validators.maxLength(100)],
      direccion:          [this.data.direccion      || '', Validators.maxLength(LIMITES.direccion)],
      paisTelefono:       [tel.codigo],
      telefono:           [tel.numero, siCambia(tel.numero, telefonoCompletoValidator())],
      correoElectronico:  [this.data.correoElectronico, [Validators.required, Validators.maxLength(LIMITES.correo),
                                                         siCambia(this.data.correoElectronico, correoValidator)]],
      rtn:                [this.data.rtn            || '', siCambia(this.data.rtn, Validators.pattern(/^\d{4}-\d{4}-\d{6}$/))],
      ocupacion:          ['', Validators.maxLength(LIMITES.ocupacion)],
      nivelEducativo:     [null],
    });
    vincular(this.form, 'tipoIdentificacion', 'identidad');
    vincular(this.form, 'paisTelefono', 'telefono');

    this.clienteService.getFicha(this.data.id).subscribe({
      next: (ficha) => {
        this.form.patchValue({ ocupacion: ficha.ocupacion ?? '', nivelEducativo: ficha.nivelEducativo });
        this.fichaCargada = true;
      },
      error: () => this.notification.error('No se pudo cargar la ocupación y el nivel educativo')
    });
  }

  get correoCambio(): boolean {
    const actual = (this.form?.get('correoElectronico')?.value ?? '').trim();
    return actual.toLowerCase() !== this.correoOriginal.toLowerCase();
  }

  get requiereConfirmarCorreo(): boolean {
    return !!this.data.tienePortal && this.correoCambio;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Revise los datos marcados en rojo');
      return;
    }
    if (this.requiereConfirmarCorreo && !this.confirmaCambioCorreo) return;
    this.guardando = true;
    const f = this.form.value;

    const up = (v: string) => v?.trim() ? v.trim().replace(/\s+/g, ' ').toUpperCase() : undefined;

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
      telefono:           f.telefono ? `${f.paisTelefono} ${f.telefono}` : undefined,
      correoElectronico:  texto(f.correoElectronico) || undefined,
      direccion:          up(f.direccion),
      rtn:                f.rtn                  || undefined,
    }).pipe(
      switchMap(() => this.fichaCargada
        ? this.clienteService.guardarFicha(this.data.id, {
            ocupacion:      (f.ocupacion ?? '').trim().toUpperCase() || null,
            nivelEducativo: f.nivelEducativo || null,
          })
        : of(null))
    ).subscribe({
      next: () => {
        const msg = this.requiereConfirmarCorreo
          ? 'Cliente actualizado. El correo de acceso al portal también se actualizó.'
          : 'Cliente actualizado correctamente';
        this.notification.success(msg);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(mensajeApi(err, 'Error al actualizar el cliente'));
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
