import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AlumnoResponse, AlumnoService, DocumentoEntregado } from '@app/services/alumno/alumno.service';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { CatalogoService, GradoDto, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { NotificationService } from '@app/services';
import { FichaAlumnoComponent } from '../ficha-alumno/ficha-alumno.component';
import {
  LIMITES, correoValidator, fechaNacimientoValidator, mensajeApi, mensajeError, nombreValidator,
  siCambia, telefonoLibreValidator, texto,
} from '../validaciones-formulario';

@Component({
  selector: 'app-edit-alumno-dialog',
  templateUrl: './edit-alumno-dialog.component.html',
  styleUrls: ['./edit-alumno-dialog.component.scss']
})
export class EditAlumnoDialogComponent implements OnInit {

  form!: FormGroup;
  fichaForm!: FormGroup;
  documentos: DocumentoEntregado[] | null = null;
  anioDocumentos: number | null = null;
  /** La ficha solo se guarda si se pudo cargar (evita borrar datos por un error de red). */
  fichaCargada = false;
  guardando = false;
  err = mensajeError;
  hoy = new Date();
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
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
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
  niveles: NivelIngles[] = [];

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
    this.catalogoService.getNivelesIngles().subscribe({ next: (data) => this.niveles = data ?? [] });
    this.alumnoService.getFoto(this.data.identidad).subscribe({
      next: ({ foto }) => { if (!this.fotoManual) this.fotoBase64 = foto ?? null; }
    });

    this.form = this.fb.group({
      // Nombres y Apellidos guardan los dos nombres (o apellidos) juntos: máximo 500 en la base (SQL 038).
      // Los formatos se validan solo si el usuario cambia el dato (hay datos viejos con otro formato).
      primerNombre:       [this.data.nombres         || '', [Validators.required, Validators.maxLength(LIMITES.nombresJuntos),
                                                            siCambia(this.data.nombres, nombreValidator)]],
      segundoNombre:      [this.data.segundoNombre   || ''],
      primerApellido:     [this.data.apellidos       || '', [Validators.maxLength(LIMITES.nombresJuntos),
                                                            siCambia(this.data.apellidos, nombreValidator)]],
      segundoApellido:    [this.data.segundoApellido || ''],
      tipoIdentificacion: [this.data.tipoIdentificacion],
      idGrado:            [this.data.idGrado,          Validators.required],
      seccion:            [this.data.seccion || 'A',   Validators.required],
      idNivelIngles:      [this.data.idNivelIngles ?? null],
      estado:             [this.data.estado],
      sexo:               [this.data.sexo               || null],
      fechaNacimiento:    [this.data.fechaNacimiento ? new Date(this.data.fechaNacimiento) : null, fechaNacimientoValidator(30)],
      nacionalidad:       [this.data.nacionalidad       || null],
      lugarNacimiento:    [this.data.lugarNacimiento    || ''],
      departamento:       [this.data.departamento       || null],
      municipio:          [this.data.municipio          || '', Validators.maxLength(100)],
      direccion:          [this.data.direccion          || '', Validators.maxLength(LIMITES.direccion)],
      telefono:           [this.data.telefono, [Validators.maxLength(LIMITES.telefono),
                                                siCambia(this.data.telefono, telefonoLibreValidator)]],
      correoElectronico:  [this.data.correoElectronico, [Validators.maxLength(LIMITES.correo),
                                                         siCambia(this.data.correoElectronico, correoValidator)]],
    });

    this.fichaForm = FichaAlumnoComponent.crearForm(this.fb);
    this.alumnoService.getFicha(this.data.identidad).subscribe({
      next: (ficha) => {
        FichaAlumnoComponent.cargar(this.fichaForm, ficha);
        this.documentos     = ficha.documentos ?? [];
        this.anioDocumentos = ficha.anioDocumentos;
        this.fichaCargada   = true;
      },
      error: () => this.notification.error('No se pudo cargar la ficha del estudiante')
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Revise los datos marcados en rojo en "Datos del estudiante"');
      return;
    }
    this.guardando = true;
    const f = this.form.value;

    const up = (v: string) => v?.trim() ? v.trim().replace(/\s+/g, ' ').toUpperCase() : undefined;

    this.alumnoService.actualizarAlumno({
      identidad:          this.data.identidad,
      tipoIdentificacion: f.tipoIdentificacion  || undefined,
      primerNombre:       up(f.primerNombre),
      segundoNombre:      up(f.segundoNombre),
      primerApellido:     up(f.primerApellido),
      segundoApellido:    up(f.segundoApellido),
      cliente:            this.clienteSeleccionado?.id ?? undefined,
      idGrado:            f.idGrado             ?? undefined,
      seccion:            up(f.seccion),
      idNivelIngles:      f.idNivelIngles == null ? 0 : f.idNivelIngles,
      estado:             f.estado              || undefined,
      // Valor de matrícula y mensualidad no se editan aquí: salen del catálogo de precios
      // (sin enviarlos, sp_EST_ActualizarAlumno conserva los guardados).
      nacionalidad:       f.nacionalidad        || undefined,
      sexo:               f.sexo                || undefined,
      fechaNacimiento:    f.fechaNacimiento
                            ? new Date(f.fechaNacimiento).toISOString().split('T')[0]
                            : undefined,
      departamento:       f.departamento        || undefined,
      municipio:          up(f.municipio),
      telefono:           texto(f.telefono)          || undefined,
      correoElectronico:  texto(f.correoElectronico) || undefined,
      direccion:          up(f.direccion),
      foto:               this.fotoBase64       ?? undefined,
    }).pipe(
      switchMap(() => this.fichaCargada
        ? this.alumnoService.guardarFicha(
            this.data.identidad,
            FichaAlumnoComponent.aDto(this.fichaForm, this.documentos, this.anioDocumentos))
        : of(null))
    ).subscribe({
      next: () => {
        this.notification.success('Estudiante actualizado correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(mensajeApi(err, 'Error al actualizar el estudiante'));
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
