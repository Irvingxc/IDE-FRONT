import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ClienteService, ClienteResponse, GuardarClienteDto, NIVELES_EDUCATIVOS } from '@app/services/cliente/cliente.service';
import { AlumnoService, DocumentoEntregado, GuardarAlumnoDto } from '@app/services/alumno/alumno.service';
import { FichaAlumnoComponent } from '../ficha-alumno/ficha-alumno.component';
import { MatriculaService, GuardarMatriculaDto } from '@app/services/matricula/matricula.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { PAISES_TELEFONO, PaisTelefono } from '../telefono-mask.directive';
import { NotificationService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { AnticipoDialogComponent, AnticipoResultado } from '../anticipo-dialog/anticipo-dialog.component';
import { DocumentosMatriculaDialogComponent } from '../documentos-matricula/documentos-matricula-dialog.component';
import { EditClienteDialogComponent } from '../edit-cliente-dialog/edit-cliente-dialog.component';
import {
  LIMITES, TIPO_DNI, anioEntreValidator, correoValidator, fechaNacimientoValidator, identidadValidator,
  juntoCon, mensajeApi, mensajeError, motivoDescuentoValidator, nombreValidator, telefonoCompletoValidator,
  telefonoLibreValidator, texto, vincular,
} from '../validaciones-formulario';

@Component({
  selector: 'app-nueva-matricula',
  templateUrl: './nueva-matricula.component.html',
  styleUrls: ['./nueva-matricula.component.scss']
})
export class NuevaMatriculaComponent implements OnInit {

  @ViewChild('stepper') stepper!: MatStepper;

  // ── Búsqueda de padre ──
  searchQuery = '';
  buscando = false;
  buscado = false;
  padreResultados: ClienteResponse[] = [];
  padreSeleccionado: ClienteResponse | null = null;
  mostrarFormPadre = false;
  guardando = false;

  // ── Validación identidad duplicada ──
  validandoIdentidad = false;
  clienteExistente: ClienteResponse | null = null;

  // ── Foto alumno ──
  fotoBase64: string | null = null;

  // ── Formularios ──
  padreForm!: FormGroup;
  alumnoForm!: FormGroup;
  fichaForm!: FormGroup;

  // ── Ficha complementaria (paso 3) ──
  documentos: DocumentoEntregado[] | null = null;
  nivelesEducativos = NIVELES_EDUCATIVOS;

  // ── Opciones de dropdowns ──
  paises: PaisTelefono[] = PAISES_TELEFONO;
  tiposId = ['DNI / Identidad', 'Pasaporte'];
  grados: GradoDto[] = [];
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  nacionalidades = [
    'Hondureño/a', 'Guatemalteco/a', 'Salvadoreño/a', 'Nicaragüense',
    'Costarricense', 'Beliceño/a', 'Panameño/a', 'Mexicano/a', 'Otro'
  ];

  sexos = ['Masculino', 'Femenino'];

  // Límites de los calendarios (las mismas reglas que los validadores).
  hoy = new Date();
  inicioMin = new Date(this.hoy.getFullYear(), 0, 1);
  inicioMax = new Date(this.hoy.getFullYear() + 1, 11, 31);

  departamentos = [
    'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés',
    'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá',
    'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
    'Santa Bárbara', 'Valle', 'Yoro'
  ];

  municipiosPorDepartamento: Record<string, string[]> = {
    'Atlántida':         ['La Ceiba', 'El Porvenir', 'Esparta', 'Jutiapa', 'La Masica', 'San Francisco', 'Tela', 'Arizona'],
    'Choluteca':         ['Choluteca', 'Apacilagua', 'Concepción de María', 'Duyure', 'El Corpus', 'El Triunfo', 'Marcovia', 'Morolica', 'Namasigüe', 'Orocuina', 'Pespire', 'San Isidro', 'San José', 'Santa Ana de Yusguare'],
    'Colón':             ['Trujillo', 'Balfate', 'Iriona', 'Limón', 'Sabá', 'Santa Fe', 'Santa Rosa de Aguán', 'Sonaguera', 'Tocoa', 'Bonito Oriental'],
    'Comayagua':         ['Comayagua', 'Ajuterique', 'El Rosario', 'Esquías', 'Humuya', 'La Libertad', 'Lamaní', 'La Trinidad', 'Lejamaní', 'Meámbar', 'Minas de Oro', 'Ojos de Agua', 'San Jerónimo', 'San José de Comayagua', 'San José del Potrero', 'San Luis', 'San Sebastián', 'Siguatepeque', 'Villa de San Antonio', 'Las Lajas', 'Taulabé'],
    'Copán':             ['Santa Rosa de Copán', 'Cabañas', 'Copán Ruinas', 'Corquín', 'Cucuyagua', 'Dolores', 'Dulce Nombre', 'El Paraíso', 'Florida', 'La Jigua', 'La Unión', 'Nueva Arcadia', 'San Agustín', 'San Antonio', 'San Jerónimo', 'San José', 'San Juan de Opoa', 'San Nicolás', 'San Pedro', 'Santa Rita', 'Trinidad de Copán', 'Veracruz'],
    'Cortés':            ['San Pedro Sula', 'Choloma', 'La Lima', 'Omoa', 'Pimienta', 'Potrerillos', 'Puerto Cortés', 'San Antonio de Cortés', 'San Francisco de Yojoa', 'San Manuel', 'Santa Cruz de Yojoa', 'Villanueva', 'El Progreso'],
    'El Paraíso':        ['Yuscarán', 'Alauca', 'Danlí', 'El Paraíso', 'Guinope', 'Jacaleapa', 'Liure', 'Morocelí', 'Oropolí', 'Potrerillos', 'San Antonio de Flores', 'San Lucas', 'San Matías', 'Soledad', 'Teupasenti', 'Texiguat', 'Vado Ancho', 'Yauyupe', 'Trojes'],
    'Francisco Morazán': ['Tegucigalpa', 'Alubarén', 'Cedros', 'Curarén', 'El Distrito Central', 'El Porvenir', 'Guaimaca', 'La Libertad', 'La Venta', 'Lepaterique', 'Maraita', 'Marale', 'Nueva Armenia', 'Ojojona', 'Orica', 'Reitoca', 'Sabanagrande', 'San Antonio de Oriente', 'San Buenaventura', 'San Ignacio', 'San Juan de Flores', 'San Miguelito', 'Santa Ana', 'Santa Lucía', 'Talanga', 'Tatumbla', 'Valle de Ángeles', 'Villa de San Francisco', 'Vallecillo'],
    'Gracias a Dios':    ['Puerto Lempira', 'Brus Laguna', 'Ahuas', 'Juan Francisco Bulnes', 'Villeda Morales', 'Wampusirpe'],
    'Intibucá':          ['La Esperanza', 'Camasca', 'Colomoncagua', 'Concepción', 'Dolores', 'Intibucá', 'Jesús de Otoro', 'Magdalena', 'Masaguara', 'San Antonio', 'San Francisco de Opalaca', 'San Isidro', 'San Juan', 'San Marcos de la Sierra', 'San Miguelito', 'Santa Lucía', 'Yamaranguila', 'San Francisco de Opalaca'],
    'Islas de la Bahía': ['Roatán', 'Guanaja', 'José Santos Guardiola', 'Utila'],
    'La Paz':            ['La Paz', 'Aguanqueterique', 'Cabañas', 'Cane', 'Chinacla', 'Guajiquiro', 'Lauterique', 'Marcala', 'Mercedes de Oriente', 'Opatoro', 'San Antonio del Norte', 'San Juan', 'San Pedro de Tutule', 'Santa Ana', 'Santa Elena', 'Santa María', 'Santiago de Puringla', 'Yarula'],
    'Lempira':           ['Gracias', 'Belén', 'Candelaria', 'Cololaca', 'Erandique', 'Gualcince', 'Guarita', 'La Campa', 'La Iguala', 'Las Flores', 'La Unión', 'La Virtud', 'Lepaera', 'Mapulaca', 'Piraera', 'San Andrés', 'San Francisco', 'San Juan Guarita', 'San Manuel Colohete', 'San Rafael', 'San Sebastián', 'Santa Cruz', 'Talgua', 'Tambla', 'Tomalá', 'Valladolid', 'Virginia', 'San Marcos de Caiquín'],
    'Ocotepeque':        ['Ocotepeque', 'Belén Gualcho', 'Concepción', 'Dolores Merendón', 'Fraternidad', 'La Encarnación', 'La Labor', 'Lucerna', 'Mercedes', 'San Fernando', 'San Francisco del Valle', 'San Jorge', 'San Marcos', 'Santa Fe', 'Sensenti', 'Sinuapa'],
    'Olancho':           ['Juticalpa', 'Campamento', 'Catacamas', 'Concordia', 'Dulce Nombre de Culmí', 'El Rosario', 'Esquipulas del Norte', 'Gualaco', 'Guarizama', 'Guata', 'Guayape', 'Jano', 'La Unión', 'Mangulile', 'Manto', 'Salama', 'San Esteban', 'San Francisco de Becerra', 'San Francisco de La Paz', 'Santa María del Real', 'Silca', 'Yocón', 'Patuca'],
    'Santa Bárbara':     ['Santa Bárbara', 'Arada', 'Atima', 'Azacualpa', 'Ceguaca', 'Concepción del Norte', 'Concepción del Sur', 'Chinda', 'El Níspero', 'Gualala', 'Ilama', 'Las Vegas', 'Macuelizo', 'Naranjito', 'Nuevo Celilac', 'Petoa', 'Protección', 'Quimistán', 'San Francisco de Ojuera', 'San José de Colinas', 'San Luis', 'San Marcos', 'San Nicolás', 'San Pedro Zacapa', 'Santa Rita', 'San Vicente Centenario', 'Trinidad', 'Villa de San Pedro'],
    'Valle':             ['Nacaome', 'Alianza', 'Amapala', 'Aramecina', 'Caridad', 'Goascorán', 'Langue', 'San Francisco de Coray', 'San Lorenzo'],
    'Yoro':              ['Yoro', 'Arenal', 'El Negrito', 'El Progreso', 'Jocon', 'Morazán', 'Olanchito', 'Santa Rita', 'Sulaco', 'Victoria', 'Yorito'],
  };

  municipiosPadre: string[] = [];
  municipiosAlumno: string[] = [];

  onDepartamentoPadreChange(depto: string): void {
    this.municipiosPadre = this.municipiosPorDepartamento[depto] || [];
    this.padreForm.get('municipio')?.setValue('');
  }

  onDepartamentoAlumnoChange(depto: string): void {
    this.municipiosAlumno = this.municipiosPorDepartamento[depto] || [];
    this.alumnoForm.get('municipio')?.setValue('');
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clienteService: ClienteService,
    private alumnoService: AlumnoService,
    private matriculaService: MatriculaService,
    private catalogoService: CatalogoService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  /** Año de la fecha de inicio de clases elegida. */
  get anioInicio(): number | null {
    const f = this.alumnoForm?.get('fechaInicioClases')?.value;
    return f ? new Date(f).getFullYear() : null;
  }

  /** Inicio de clases en un año posterior al actual: el backend la registra como prematrícula. */
  get esPrematricula(): boolean {
    const anio = this.anioInicio;
    return anio != null && anio > new Date().getFullYear();
  }

  /** Nombre completo del alumno tal como se guarda (en mayúsculas). */
  private get nombreAlumno(): string {
    const a = this.alumnoForm.value;
    return [a.nombres, a.segundoNombre, a.apellidos, a.segundoApellido]
      .map((v: string) => (v ?? '').trim()).filter(Boolean).join(' ').toUpperCase();
  }

  /** Padre / encargado para el contrato: el existente seleccionado o el recién registrado. */
  private get padreContrato(): { nombreCompleto: string; identidad: string } {
    const p = this.padreSeleccionado;
    if (p) {
      // "Buscar por identidad" devuelve en nombreCompleto solo los nombres: se arma con las partes.
      const partes = [p.nombres, p.segundoNombre, p.apellidos, p.segundoApellido]
        .map(v => (v ?? '').trim()).filter(Boolean);
      return {
        nombreCompleto: (p.apellidos ? partes.join(' ') : (p.nombreCompleto ?? '')).replace(/\s+/g, ' ').trim(),
        identidad:      p.identidad ?? '',
      };
    }
    const f = this.padreForm.value;
    return {
      nombreCompleto: [f.primerNombre, f.segundoNombre, f.primerApellido, f.segundoApellido]
        .map((v: string) => (v ?? '').trim()).filter(Boolean).join(' ').toUpperCase(),
      identidad: f.identificacion ?? '',
    };
  }

  // Tras guardar: matrícula normal → contrato; prematrícula → anticipo, comprobante y contrato.
  private alGuardar(): void {
    const a = this.alumnoForm.value;

    if (!this.esPrematricula) {
      this.notification.success('Matrícula registrada correctamente');
      const grado = this.grados.find(g => g.idGrado === a.idGrado)?.gradoNombre ?? '';
      DocumentosMatriculaDialogComponent.abrir(this.dialog, {
        modo:    'contrato',
        cliente: this.padreContrato,
        alumno:  {
          nombreCompleto: this.nombreAlumno,
          grado:          [grado, (a.seccion ?? '').toUpperCase()].filter(Boolean).join(' '),
          descuento:      a.descuento ?? 0,
        },
        idGrado: a.idGrado,
        anio:    this.anioInicio ?? new Date().getFullYear(),
      }).afterClosed().subscribe(() => this.router.navigate(['/matriculas']));
      return;
    }

    this.notification.success('Alumno prematriculado correctamente');
    const ref = this.dialog.open(AnticipoDialogComponent, {
      width: '640px',
      disableClose: true,
      data: {
        identidad:    a.identidad,
        anio:         this.anioInicio,
        alumnoNombre: this.nombreAlumno,
        gradoNombre:  this.grados.find(g => g.idGrado === a.idGrado)?.gradoNombre ?? null,
      }
    });
    ref.afterClosed().subscribe((r?: AnticipoResultado | false) => {
      if (!r) { this.router.navigate(['/matriculas']); return; }
      // Comprobante (Imprimir / Siguiente) y luego el contrato del padre para este alumno.
      DocumentosMatriculaDialogComponent.abrir(this.dialog, {
        modo:          'prematricula',
        idComprobante: r.idComprobante,
        identidad:     a.identidad,
        anio:          this.anioInicio!,
      }).afterClosed().subscribe(() => this.router.navigate(['/matriculas']));
    });
  }

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe({ next: (data) => this.grados = data ?? [] });

    this.padreForm = this.fb.group({
      tipoIdentificacion: [TIPO_DNI, Validators.required],
      identificacion:     ['', [Validators.required, identidadValidator()]],
      primerNombre:       ['', [Validators.required, nombreValidator, juntoCon('segundoNombre')]],
      segundoNombre:      ['', [nombreValidator, juntoCon('primerNombre')]],
      primerApellido:     ['', [Validators.required, nombreValidator, juntoCon('segundoApellido')]],
      segundoApellido:    ['', [nombreValidator, juntoCon('primerApellido')]],
      sexo:               ['', Validators.required],
      fechaNacimiento:    [null, fechaNacimientoValidator(100)],
      nacionalidad:       ['', Validators.required],
      lugarNacimiento:    ['', Validators.maxLength(LIMITES.lugarNacimiento)],
      departamento:       ['', Validators.required],
      municipio:          ['', Validators.required],
      direccion:          ['', Validators.maxLength(LIMITES.direccion)],
      paisTelefono:       ['+504'],
      telefono:           ['', telefonoCompletoValidator()],
      correoElectronico:  ['', [Validators.required, correoValidator, Validators.maxLength(LIMITES.correo)]],
      rtn:                ['', Validators.pattern(/^\d{4}-\d{4}-\d{6}$/)],
      ocupacion:          ['', Validators.maxLength(LIMITES.ocupacion)],
      nivelEducativo:     [null],
    });
    vincular(this.padreForm, 'primerNombre', 'segundoNombre');
    vincular(this.padreForm, 'segundoNombre', 'primerNombre');
    vincular(this.padreForm, 'primerApellido', 'segundoApellido');
    vincular(this.padreForm, 'segundoApellido', 'primerApellido');
    vincular(this.padreForm, 'paisTelefono', 'telefono');
    vincular(this.padreForm, 'tipoIdentificacion', 'identificacion');

    this.fichaForm = FichaAlumnoComponent.crearForm(this.fb);
    this.alumnoService.getDocumentosMatricula().subscribe({
      next: (docs) => this.documentos = docs ?? [],
      error: () => this.documentos = null
    });

    const anioActual = new Date().getFullYear();
    this.alumnoForm = this.fb.group({
      // Obligatorio: sin tipo, la máscara no pone guiones y la identidad se guardaba sin formato.
      tipoIdentificacion: [TIPO_DNI, Validators.required],
      identidad:          ['', [Validators.required, identidadValidator(), this.identidadNoDuplicada]],
      nombres:            ['', [Validators.required, nombreValidator, juntoCon('segundoNombre')]],
      segundoNombre:      ['', [nombreValidator, juntoCon('nombres')]],
      apellidos:          ['', [Validators.required, nombreValidator, juntoCon('segundoApellido')]],
      segundoApellido:    ['', [nombreValidator, juntoCon('apellidos')]],
      idGrado:            [null, Validators.required],
      seccion:            ['A', Validators.required],
      // Año actual = matrícula; año siguiente = prematrícula.
      fechaInicioClases:  [null, [Validators.required, anioEntreValidator(anioActual, anioActual + 1)]],
      descuento:          [null, [Validators.min(0), Validators.max(100)]],
      motivoDescuento:    ['', [Validators.maxLength(LIMITES.motivoDescuento), motivoDescuentoValidator()]],
      matriculaGratis:    [false],
      nacionalidad:       [''],
      sexo:               [''],
      fechaNacimiento:    [null, fechaNacimientoValidator(25)],
      departamento:       [''],
      municipio:          [''],
      lugarNacimiento:    ['', Validators.maxLength(LIMITES.lugarNacimiento)],
      direccion:          ['', Validators.maxLength(LIMITES.direccion)],
      telefono:           ['', [Validators.maxLength(LIMITES.telefono), telefonoLibreValidator]],
      correoElectronico:  ['', [correoValidator, Validators.maxLength(LIMITES.correo)]],
    });
    vincular(this.alumnoForm, 'nombres', 'segundoNombre');
    vincular(this.alumnoForm, 'segundoNombre', 'nombres');
    vincular(this.alumnoForm, 'apellidos', 'segundoApellido');
    vincular(this.alumnoForm, 'segundoApellido', 'apellidos');
    vincular(this.alumnoForm, 'tipoIdentificacion', 'identidad');
    vincular(this.alumnoForm, 'descuento', 'motivoDescuento');
  }

  /** Identidades de estudiante que ya existen (consultadas al salir del campo). */
  private identidadesExistentes = new Set<string>();
  validandoIdentidadAlumno = false;

  private readonly identidadNoDuplicada: ValidatorFn = c =>
    this.identidadesExistentes.has(texto(c.value).replace(/-/g, '')) ? { identidadDuplicada: true } : null;

  /**
   * Avisa antes de guardar si la identidad del estudiante ya está registrada
   * (con o sin guiones: hay registros viejos guardados sin guiones).
   */
  validarIdentidadAlumno(): void {
    const ctrl = this.alumnoForm.get('identidad')!;
    const identidad = texto(ctrl.value);
    if (!identidad || ctrl.hasError('dni') || ctrl.hasError('pasaporte')) return;

    const variantes = Array.from(new Set([identidad, identidad.replace(/-/g, '')]));
    const existe = (id: string) => this.alumnoService.getFicha(id).pipe(
      map(() => true),
      catchError(() => of(false))   // 404 = no existe; otro error no bloquea (el backend valida al guardar)
    );
    this.validandoIdentidadAlumno = true;
    forkJoin(variantes.map(existe)).subscribe(r => {
      this.validandoIdentidadAlumno = false;
      if (r.some(Boolean)) this.identidadesExistentes.add(identidad.replace(/-/g, ''));
      ctrl.updateValueAndValidity();
      ctrl.markAsTouched();
    });
  }

  err = mensajeError;

  get paisPadreSeleccionado(): PaisTelefono {
    const codigo = this.padreForm?.get('paisTelefono')?.value ?? '+504';
    return this.paises.find(p => p.codigo === codigo) ?? this.paises[0];
  }

  get padreValido(): boolean {
    return (this.padreSeleccionado !== null && this.padreTieneCorreo) ||
           (this.mostrarFormPadre && this.padreForm.valid);
  }

  /** El correo del cliente es obligatorio (portal, avisos y comprobantes). */
  get padreTieneCorreo(): boolean {
    return !!this.padreSeleccionado?.correoElectronico?.trim();
  }

  // Cliente existente sin correo: se completa aquí mismo con el diálogo de edición.
  agregarCorreoPadre(): void {
    const padre = this.padreSeleccionado;
    if (!padre) return;
    const ref = this.dialog.open(EditClienteDialogComponent, { width: '660px', data: padre });
    ref.afterClosed().subscribe(actualizado => {
      if (!actualizado || !padre.identidad) return;
      this.clienteService.buscarPorIdentidad(padre.identidad).subscribe(c => {
        if (c) this.padreSeleccionado = c;
      });
    });
  }

  onFotoSeleccionada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.fotoBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  buscarPadre(): void {
    if (!this.searchQuery.trim()) return;
    this.buscando = true;
    this.buscado = false;
    this.padreResultados = [];
    this.padreSeleccionado = null;
    this.mostrarFormPadre = false;

    this.clienteService.buscarPorNombre(this.searchQuery).subscribe({
      next: (data) => {
        this.padreResultados = data ?? [];
        this.buscado = true;
        this.buscando = false;
      },
      error: () => {
        this.padreResultados = [];
        this.buscado = true;
        this.buscando = false;
      }
    });
  }

  seleccionarPadre(padre: ClienteResponse): void {
    this.padreSeleccionado = padre;
    this.padreResultados = [];
    this.mostrarFormPadre = false;
  }

  deseleccionarPadre(): void {
    this.padreSeleccionado = null;
  }

  mostrarNuevoPadre(): void {
    this.padreSeleccionado = null;
    this.mostrarFormPadre = true;
    this.padreResultados = [];
    this.buscado = false;
    this.clienteExistente = null;
  }

  validarIdentidadExistente(): void {
    const identidad = this.padreForm.get('identificacion')?.value?.trim();
    if (!identidad) { this.clienteExistente = null; return; }

    this.validandoIdentidad = true;
    this.clienteExistente = null;

    this.clienteService.buscarPorIdentidad(identidad).subscribe({
      next: (cliente) => {
        this.clienteExistente = cliente;
        this.validandoIdentidad = false;
      },
      error: () => { this.validandoIdentidad = false; }
    });
  }

  usarClienteExistente(): void {
    if (this.clienteExistente) {
      this.seleccionarPadre(this.clienteExistente);
      this.mostrarFormPadre = false;
      this.clienteExistente = null;
    }
  }

  continuarAAlumno(): void {
    if (!this.padreValido) {
      this.padreForm.markAllAsTouched();
      return;
    }
    this.stepper.next();
  }

  continuarAFicha(): void {
    if (this.alumnoForm.invalid) {
      this.alumnoForm.markAllAsTouched();
      this.notification.error('Faltan datos obligatorios del estudiante (marcados en rojo)');
      return;
    }
    this.stepper.next();
  }

  /**
   * Guarda la ficha del alumno (y ocupación / nivel educativo del padre nuevo)
   * después de registrar la matrícula. Si falla, la matrícula ya quedó guardada:
   * solo se avisa para completarla desde "Editar estudiante".
   */
  private guardarFichas(idClienteNuevo: number | null): Observable<boolean> {
    const a = this.alumnoForm.value;
    const tareas: Observable<unknown>[] = [
      this.alumnoService.guardarFicha(
        a.identidad,
        FichaAlumnoComponent.aDto(this.fichaForm, this.documentos, this.anioInicio))
    ];

    const p = this.padreForm.value;
    const ocupacion = (p.ocupacion ?? '').trim().toUpperCase() || null;
    if (idClienteNuevo && (ocupacion || p.nivelEducativo)) {
      tareas.push(this.clienteService.guardarFicha(idClienteNuevo, {
        ocupacion,
        nivelEducativo: p.nivelEducativo || null,
      }));
    }

    return forkJoin(tareas).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private finalizar(idClienteNuevo: number | null): void {
    this.guardarFichas(idClienteNuevo).subscribe(ok => {
      if (!ok) {
        this.notification.error(
          'La matrícula se guardó, pero no la ficha (salud, uniforme, documentos). Complétela desde "Editar estudiante".');
      }
      this.alGuardar();
    });
  }

  guardar(): void {
    if (this.alumnoForm.invalid) {
      this.alumnoForm.markAllAsTouched();
      this.stepper.selectedIndex = 1;
      this.notification.error('Faltan datos obligatorios del estudiante (marcados en rojo)');
      return;
    }
    this.guardando = true;

    if (this.padreSeleccionado) {
      this.enviarAlumno(this.padreSeleccionado.id);
    } else {
      const f = this.padreForm.value;
      const a = this.alumnoForm.value;
      const up = (v: string) => v?.trim() ? v.trim().replace(/\s+/g, ' ').toUpperCase() : undefined;

      const dto: GuardarMatriculaDto = {
        // Cliente
        tipoIdentificacionCliente: f.tipoIdentificacion,
        identidadCliente:          f.identificacion,
        primerNombreCliente:       up(f.primerNombre)!,
        segundoNombreCliente:      up(f.segundoNombre),
        primerApellidoCliente:     up(f.primerApellido)!,
        segundoApellidoCliente:    up(f.segundoApellido),
        nacionalidadCliente:       f.nacionalidad,
        sexoCliente:               f.sexo,
        fechaNacimientoCliente:    f.fechaNacimiento
                                     ? new Date(f.fechaNacimiento).toISOString().split('T')[0]
                                     : null,
        lugarNacimientoCliente:    up(f.lugarNacimiento),
        departamentoCliente:       f.departamento,
        municipioCliente:          f.municipio,
        direccionCliente:          up(f.direccion),
        telefonoCliente:           f.telefono ? `${f.paisTelefono} ${f.telefono}` : '',
        correoElectronicoCliente:  texto(f.correoElectronico) || undefined,
        rtnCliente:                f.rtn               || undefined,

        // Alumno
        identidadAlumno:           a.identidad,
        tipoIdentificacionAlumno:  a.tipoIdentificacion || undefined,
        primerNombreAlumno:        up(a.nombres)!,
        segundoNombreAlumno:       up(a.segundoNombre),
        primerApellidoAlumno:      up(a.apellidos)!,
        segundoApellidoAlumno:     up(a.segundoApellido),
        idGrado:                   a.idGrado,
        seccion:                   up(a.seccion),
        fechaInicioClases:         a.fechaInicioClases
                                     ? new Date(a.fechaInicioClases).toISOString().split('T')[0]
                                     : null,
        nacionalidadAlumno:        a.nacionalidad       || undefined,
        sexoAlumno:                a.sexo               || undefined,
        fechaNacimientoAlumno:     a.fechaNacimiento
                                     ? new Date(a.fechaNacimiento).toISOString().split('T')[0]
                                     : null,
        lugarNacimientoAlumno:     up(a.lugarNacimiento),
        departamentoAlumno:        a.departamento       || undefined,
        municipioAlumno:           a.municipio          || undefined,
        direccionAlumno:           up(a.direccion),
        telefonoAlumno:            texto(a.telefono) || undefined,
        correoElectronicoAlumno:   texto(a.correoElectronico) || undefined,
        descuento:                 a.descuento          ?? undefined,
        motivoDescuento:           texto(a.motivoDescuento) || undefined,
        foto:                      this.fotoBase64      ?? undefined,
        matriculaGratis:           !!a.matriculaGratis,
      };

      this.matriculaService.guardarMatricula(dto).subscribe({
        next: (r) => this.finalizar(r?.idCliente ?? null),
        error: (err) => {
          this.notification.error(mensajeApi(err, 'Error al registrar la matrícula. No se guardaron datos.'));
          this.guardando = false;
        }
      });
    }
  }

  private enviarAlumno(idCliente: number): void {
    const a = this.alumnoForm.value;
    const up = (v: string) => v?.trim() ? v.trim().replace(/\s+/g, ' ').toUpperCase() : undefined;
    const dto: GuardarAlumnoDto = {
      identidad:          a.identidad,
      tipoIdentificacion: a.tipoIdentificacion || undefined,
      primerNombre:       up(a.nombres)!,
      segundoNombre:      up(a.segundoNombre),
      primerApellido:     up(a.apellidos)!,
      segundoApellido:    up(a.segundoApellido),
      cliente:            idCliente,
      estado:             'Activo',
      idGrado:            a.idGrado,
      seccion:            up(a.seccion),
      fechaInicioClases:  a.fechaInicioClases
                            ? new Date(a.fechaInicioClases).toISOString().split('T')[0]
                            : null,
      descuento:          a.descuento          ?? undefined,
      motivoDescuento:    texto(a.motivoDescuento) || undefined,
      foto:               this.fotoBase64      ?? undefined,
      matriculaGratis:    !!a.matriculaGratis,
      nacionalidad:       a.nacionalidad       || undefined,
      sexo:               a.sexo               || undefined,
      fechaNacimiento:    a.fechaNacimiento
                            ? new Date(a.fechaNacimiento).toISOString().split('T')[0]
                            : null,
      lugarNacimiento:    up(a.lugarNacimiento),
      departamento:       a.departamento       || undefined,
      municipio:          a.municipio          || undefined,
      direccion:          up(a.direccion),
      telefono:           texto(a.telefono) || undefined,
      correoElectronico:  texto(a.correoElectronico) || undefined,
    };

    this.alumnoService.guardarAlumno(dto).subscribe({
      next: () => this.finalizar(null),
      error: (err) => {
        this.notification.error(mensajeApi(err, 'Error al registrar el estudiante. No se guardaron datos.'));
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/matriculas']);
  }
}
