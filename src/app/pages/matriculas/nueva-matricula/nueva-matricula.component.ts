import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { ClienteService, ClienteResponse, GuardarClienteDto } from '@app/services/cliente/cliente.service';
import { AlumnoService, GuardarAlumnoDto } from '@app/services/alumno/alumno.service';
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

  // ── Formularios ──
  padreForm!: FormGroup;
  alumnoForm!: FormGroup;

  // ── Opciones de dropdowns ──
  tiposId = ['DNI / Identidad', 'Pasaporte'];

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

  grados = [
    'Primer Grado Pre-Basica', 'Segundo Grado Pre-Basica', 'Tercer Grado Pre-Basica',
    'Primer Grado Basica', 'Segundo Grado Basica', 'Tercer Grado Basica',
    'Cuarto Grado Basica', 'Quinto Grado Basica', 'Sexto Grado Basica',
    'Septimo Grado Basica', 'Octavo Grado Basica', 'Noveno Grado Basica',
    'Decimo', 'Undecimo',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clienteService: ClienteService,
    private alumnoService: AlumnoService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
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
      grado:              ['', Validators.required],
      valorMatricula:     [null, [Validators.required, Validators.min(0)]],
      valorMensualidad:   [null, [Validators.required, Validators.min(0)]],
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

  get padreValido(): boolean {
    return this.padreSeleccionado !== null ||
           (this.mostrarFormPadre && this.padreForm.valid);
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
      const up = (v: string) => v ? v.toUpperCase() : undefined;

      const dto: GuardarClienteDto = {
        tipoIdentificacion: f.tipoIdentificacion,
        identidad:          f.identificacion,
        primerNombre:       up(f.primerNombre)!,
        segundoNombre:      up(f.segundoNombre),
        primerApellido:     up(f.primerApellido)!,
        segundoApellido:    up(f.segundoApellido),
        nacionalidad:       f.nacionalidad,
        sexo:               f.sexo,
        fechaNacimiento:    f.fechaNacimiento
                              ? new Date(f.fechaNacimiento).toISOString().split('T')[0]
                              : null,
        lugarNacimiento:    up(f.lugarNacimiento),
        departamento:       f.departamento,
        municipio:          f.municipio,
        direccion:          up(f.direccion),
        telefono:           f.telefono,
        correoElectronico:  f.correoElectronico || undefined,
        rtn:                f.rtn               || undefined,
      };

      this.clienteService.guardarCliente(dto).subscribe({
        next: (res) => {
          const idCliente = res?.idCliente;
          if (!idCliente) {
            this.notification.error('No se obtuvo el ID del cliente registrado');
            this.guardando = false;
            return;
          }
          this.enviarAlumno(idCliente);
        },
        error: () => {
          this.notification.error('Error al registrar el padre/tutor');
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
      grado:              a.grado,
      valorMatricula:     a.valorMatricula,
      valorMensualidad:   a.valorMensualidad,
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
        this.notification.error('Error al registrar el alumno');
        this.guardando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/matriculas']);
  }
}
