import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlumnoResponse, AlumnoService } from '@app/services/alumno/alumno.service';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { NotificationService } from '@app/services';

@Component({
  selector: 'app-edit-alumno-dialog',
  templateUrl: './edit-alumno-dialog.component.html',
  styleUrls: ['./edit-alumno-dialog.component.scss']
})
export class EditAlumnoDialogComponent implements OnInit {

  form!: FormGroup;
  guardando = false;
  fotoBase64: string | null = null;
  private fotoManual = false;

  // Búsqueda de cliente
  searchCliente = '';
  buscandoCliente = false;
  clienteResultados: ClienteResponse[] = [];
  clienteSeleccionado: ClienteResponse | null = null;

  tiposId = ['DNI / Identidad', 'Pasaporte'];
  sexos = ['Masculino', 'Femenino'];
  estados = ['Activo', 'Inactivo'];
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
  grados: GradoDto[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditAlumnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlumnoResponse,
    private alumnoService: AlumnoService,
    private clienteService: ClienteService,
    private catalogoService: CatalogoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe({ next: (data) => this.grados = data ?? [] });
    this.alumnoService.getFoto(this.data.identidad).subscribe({
      next: ({ foto }) => { if (!this.fotoManual) this.fotoBase64 = foto ?? null; }
    });

    this.form = this.fb.group({
      primerNombre:       [this.data.nombres         || '', Validators.required],
      segundoNombre:      [this.data.segundoNombre   || ''],
      primerApellido:     [this.data.apellidos       || ''],
      segundoApellido:    [this.data.segundoApellido || ''],
      tipoIdentificacion: [this.data.tipoIdentificacion],
      idGrado:            [this.data.idGrado,          Validators.required],
      estado:             [this.data.estado],
      valorMatricula:     [this.data.valorMatricula,   [Validators.required, Validators.min(0)]],
      valorMensualidad:   [this.data.valorMensualidad, [Validators.required, Validators.min(0)]],
      sexo:               [this.data.sexo               || null],
      fechaNacimiento:    [this.data.fechaNacimiento ? new Date(this.data.fechaNacimiento) : null],
      nacionalidad:       [this.data.nacionalidad       || null],
      lugarNacimiento:    [this.data.lugarNacimiento    || ''],
      departamento:       [this.data.departamento       || null],
      municipio:          [this.data.municipio          || ''],
      direccion:          [this.data.direccion          || ''],
      telefono:           [this.data.telefono],
      correoElectronico:  [this.data.correoElectronico, Validators.email],
    });
  }

  onFotoSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoManual = true;
    const reader = new FileReader();
    reader.onload = () => { this.fotoBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  buscarCliente(): void {
    if (!this.searchCliente.trim()) return;
    this.buscandoCliente = true;
    this.clienteResultados = [];
    this.clienteService.buscarPorNombre(this.searchCliente).subscribe({
      next: (data) => { this.clienteResultados = data ?? []; this.buscandoCliente = false; },
      error: ()     => { this.clienteResultados = [];         this.buscandoCliente = false; }
    });
  }

  seleccionarCliente(c: ClienteResponse): void {
    this.clienteSeleccionado = c;
    this.clienteResultados = [];
    this.searchCliente = '';
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando = true;
    const f = this.form.value;

    const up = (v: string) => v ? v.toUpperCase() : undefined;

    this.alumnoService.actualizarAlumno({
      identidad:          this.data.identidad,
      tipoIdentificacion: f.tipoIdentificacion  || undefined,
      primerNombre:       up(f.primerNombre),
      segundoNombre:      up(f.segundoNombre),
      primerApellido:     up(f.primerApellido),
      segundoApellido:    up(f.segundoApellido),
      cliente:            this.clienteSeleccionado?.id ?? undefined,
      idGrado:            f.idGrado             ?? undefined,
      estado:             f.estado              || undefined,
      valorMatricula:     f.valorMatricula      ?? undefined,
      valorMensualidad:   f.valorMensualidad    ?? undefined,
      nacionalidad:       f.nacionalidad        || undefined,
      sexo:               f.sexo                || undefined,
      fechaNacimiento:    f.fechaNacimiento
                            ? new Date(f.fechaNacimiento).toISOString().split('T')[0]
                            : undefined,
      departamento:       f.departamento        || undefined,
      municipio:          up(f.municipio),
      telefono:           f.telefono            || undefined,
      correoElectronico:  f.correoElectronico   || undefined,
      direccion:          up(f.direccion),
      foto:               this.fotoBase64       ?? undefined,
    }).subscribe({
      next: () => {
        this.notification.success('Alumno actualizado correctamente');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notification.error('Error al actualizar el alumno');
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
