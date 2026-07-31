import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { ClienteService, ClienteResponse, GuardarClienteDto } from '@app/services/cliente/cliente.service';
import { AlumnoService, GuardarAlumnoDto } from '@app/services/alumno/alumno.service';
import { MatriculaService, GuardarMatriculaDto } from '@app/services/matricula/matricula.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { PAISES_TELEFONO, PaisTelefono } from '../telefono-mask.directive';
import { NotificationService } from '@app/services';

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

  // ── Opciones de dropdowns ──
  paises: PaisTelefono[] = PAISES_TELEFONO;
  tiposId = ['DNI / Identidad', 'Pasaporte'];
  grados: GradoDto[] = [];

  nacionalidades = [
    'Hondureño/a', 'Guatemalteco/a', 'Salvadoreño/a', 'Nicaragüense',
    'Costarricense', 'Beliceño/a', 'Panameño/a', 'Mexicano/a', 'Otro'
  ];

  sexos = ['Masculino', 'Femenino'];

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
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe({ next: (data) => this.grados = data ?? [] });

    this.padreForm = this.fb.group({
      tipoIdentificacion: ['', Validators.required],
      identificacion:     ['', Validators.required],
      primerNombre:       ['', Validators.required],
      segundoNombre:      [''],
      primerApellido:     ['', Validators.required],
      segundoApellido:    [''],
      sexo:               ['', Validators.required],
      fechaNacimiento:    [null],
      nacionalidad:       ['', Validators.required],
      lugarNacimiento:    [''],
      departamento:       ['', Validators.required],
      municipio:          ['', Validators.required],
      direccion:          [''],
      paisTelefono:       ['+504'],
      telefono:           [''],
      correoElectronico:  ['', Validators.email],
      rtn:                ['', Validators.pattern(/^\d{4}-\d{4}-\d{6}$/)],
    });

    this.alumnoForm = this.fb.group({
      tipoIdentificacion: [''],
      identidad:          ['', Validators.required],
      nombres:            ['', Validators.required],
      segundoNombre:      [''],
      apellidos:          ['', Validators.required],
      segundoApellido:    [''],
      idGrado:            [null, Validators.required],
      fechaInicioClases:  [null, Validators.required],
      descuento:          [null, Validators.min(0)],
      motivoDescuento:    [''],
      nacionalidad:       [''],
      sexo:               [''],
      fechaNacimiento:    [null],
      departamento:       [''],
      municipio:          [''],
      lugarNacimiento:    [''],
      direccion:          [''],
      telefono:           [''],
      correoElectronico:  ['', Validators.email],
    });
  }

  get paisPadreSeleccionado(): PaisTelefono {
    const codigo = this.padreForm?.get('paisTelefono')?.value ?? '+504';
    return this.paises.find(p => p.codigo === codigo) ?? this.paises[0];
  }

  get padreValido(): boolean {
    return this.padreSeleccionado !== null ||
           (this.mostrarFormPadre && this.padreForm.valid);
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

  guardar(): void {
    if (this.alumnoForm.invalid) {
      this.alumnoForm.markAllAsTouched();
      return;
    }
    this.guardando = true;

    if (this.padreSeleccionado) {
      this.enviarAlumno(this.padreSeleccionado.id);
    } else {
      const f = this.padreForm.value;
      const a = this.alumnoForm.value;
      const up = (v: string) => v ? v.toUpperCase() : undefined;

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
        correoElectronicoCliente:  f.correoElectronico || undefined,
        rtnCliente:                f.rtn               || undefined,

        // Alumno
        identidadAlumno:           a.identidad,
        tipoIdentificacionAlumno:  a.tipoIdentificacion || undefined,
        primerNombreAlumno:        up(a.nombres)!,
        segundoNombreAlumno:       up(a.segundoNombre),
        primerApellidoAlumno:      up(a.apellidos)!,
        segundoApellidoAlumno:     up(a.segundoApellido),
        idGrado:                   a.idGrado,
        fechaInicioClases:         a.fechaInicioClases
                                     ? new Date(a.fechaInicioClases).toISOString().split('T')[0]
                                     : null,
        nacionalidadAlumno:        a.nacionalidad       || undefined,
        sexoAlumno:                a.sexo               || undefined,
        fechaNacimientoAlumno:     a.fechaNacimiento
                                     ? new Date(a.fechaNacimiento).toISOString().split('T')[0]
                                     : null,
        lugarNacimientoAlumno:     a.lugarNacimiento    || undefined,
        departamentoAlumno:        a.departamento       || undefined,
        municipioAlumno:           a.municipio          || undefined,
        direccionAlumno:           a.direccion          || undefined,
        telefonoAlumno:            a.telefono           || undefined,
        correoElectronicoAlumno:   a.correoElectronico  || undefined,
        descuento:                 a.descuento          ?? undefined,
        motivoDescuento:           a.motivoDescuento    || undefined,
        foto:                      this.fotoBase64      ?? undefined,
      };

      this.matriculaService.guardarMatricula(dto).subscribe({
        next: () => {
          this.notification.success('Matrícula registrada correctamente');
          this.router.navigate(['/matriculas']);
        },
        error: () => {
          this.notification.error('Error al registrar la matrícula. No se guardaron datos.');
          this.guardando = false;
        }
      });
    }
  }

  private enviarAlumno(idCliente: number): void {
    const a = this.alumnoForm.value;
    const up = (v: string) => v ? v.toUpperCase() : undefined;
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
      fechaInicioClases:  a.fechaInicioClases
                            ? new Date(a.fechaInicioClases).toISOString().split('T')[0]
                            : null,
      descuento:          a.descuento          ?? undefined,
      motivoDescuento:    a.motivoDescuento    || undefined,
      foto:               this.fotoBase64      ?? undefined,
      nacionalidad:       a.nacionalidad       || undefined,
      sexo:               a.sexo               || undefined,
      fechaNacimiento:    a.fechaNacimiento
                            ? new Date(a.fechaNacimiento).toISOString().split('T')[0]
                            : null,
      lugarNacimiento:    a.lugarNacimiento    || undefined,
      departamento:       a.departamento       || undefined,
      municipio:          a.municipio          || undefined,
      direccion:          a.direccion          || undefined,
      telefono:           a.telefono           || undefined,
      correoElectronico:  a.correoElectronico  || undefined,
    };

    this.alumnoService.guardarAlumno(dto).subscribe({
      next: () => {
        this.notification.success('Matrícula registrada correctamente');
        this.router.navigate(['/matriculas']);
      },
      error: () => {
        this.notification.error('Error al registrar el estudiante');
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/matriculas']);
  }
}
