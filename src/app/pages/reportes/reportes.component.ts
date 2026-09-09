import { Component, OnInit } from '@angular/core';
import { AsistenciaService, AsistenciaReporteItem, EmpleadoReporteItem, EmpleadoReporteMensualItem } from '@app/services/asistencia/asistencia.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FeriadosDialogComponent } from './feriados-dialog/feriados-dialog.component';
import {
  AcademicoService, PeriodoResponse, AlumnoGrado, ReporteNotaClase
} from '@app/services/academico/academico.service';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  // ── Asistencia ────────────────────────────────────────────
  fechaAsistencia = new Date();
  grados: GradoDto[] = [];
  filtroIdGrado: number | null = null;
  filtroEstado: '' | 'Presente' | 'Ausente' = '';

  reporteAsistencia: AsistenciaReporteItem[] = [];
  loadingAsistencia = true;
  columnasAsistencia = ['nombreCompleto', 'grado', 'seccion', 'estado', 'horaMarca', 'nombrePadre'];

  get reporteFiltrado(): AsistenciaReporteItem[] {
    if (!this.filtroEstado) return this.reporteAsistencia;
    return this.reporteAsistencia.filter(a => a.estado === this.filtroEstado);
  }

  get totalPresentes(): number {
    return this.reporteAsistencia.filter(a => a.estado === 'Presente').length;
  }

  get totalAusentes(): number {
    return this.reporteAsistencia.filter(a => a.estado === 'Ausente').length;
  }

  // ── Control Empleados ────────────────────────────────────
  fechaEmpleados = new Date();
  reporteEmpleados: EmpleadoReporteItem[] = [];
  loadingEmpleados = true;
  columnasEmpleados = ['codigoInterno', 'nombreCompleto', 'departamento', 'estado', 'horaPrimera', 'horaUltima', 'duracion'];

  get totalPresentesEmpleados(): number {
    return this.reporteEmpleados.filter(e => e.estado === 'Presente').length;
  }

  get totalAusentesEmpleados(): number {
    return this.reporteEmpleados.filter(e => e.estado === 'Ausente').length;
  }

  // ── Reporte Mensual (para pago) ──────────────────────────
  mensualDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  mensualHasta: Date = new Date();
  mensualHoraEntrada = '08:00';
  mensualTolerancia = 5;
  mensualHoraSalida = '17:00';
  mensualJornada = 8;

  reporteMensual: EmpleadoReporteMensualItem[] = [];
  loadingMensual = false;
  mensualGenerado = false;
  columnasMensual = [
    'nombreCompleto', 'departamento', 'diasTrabajados', 'diasAusentes',
    'horasTrabajadas', 'horasTarde', 'llegadasTarde',
    'horasSalidaTemprana', 'salidasTempranas', 'horasExtra'
  ];

  private sumaMensual(campo: keyof EmpleadoReporteMensualItem): number {
    return this.reporteMensual.reduce((acc, r) => acc + (Number(r[campo]) || 0), 0);
  }

  get totalHorasTrabajadas(): number { return this.sumaMensual('horasTrabajadas'); }
  get totalHorasTarde(): number { return this.sumaMensual('horasTarde'); }
  get totalHorasExtra(): number { return this.sumaMensual('horasExtra'); }
  get totalHorasSalidaTemprana(): number { return this.sumaMensual('horasSalidaTemprana'); }

  // ── Sincronizacion con Zlink (compartida por los tabs) ──
  sincronizando = false;

  // ── Notas (reporte por alumno) ───────────────────────────
  notasPeriodos: PeriodoResponse[] = [];
  notasIdPeriodo: number | null = null;
  notasIdGrado: number | null = null;
  notasAlumnos: AlumnoGrado[] = [];
  notasAlumnoIdentidad: string | null = null;
  notasAlumnoFiltro = '';
  cargandoAlumnos = false;
  cargandoNotas = false;
  notasBuscado = false;
  reporteNotas: ReporteNotaClase[] = [];

  get notasAlumnosFiltrados(): AlumnoGrado[] {
    const q = this.notasAlumnoFiltro.trim().toLowerCase();
    if (!q) return this.notasAlumnos;
    return this.notasAlumnos.filter(a => a.nombreCompleto.toLowerCase().includes(q));
  }

  get notasAlumnoSeleccionado(): AlumnoGrado | null {
    return this.notasAlumnos.find(a => a.identidad === this.notasAlumnoIdentidad) ?? null;
  }

  constructor(
    private asistenciaService: AsistenciaService,
    private catalogoService: CatalogoService,
    private academicoService: AcademicoService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
    this.cargarAsistencia();
    this.cargarEmpleados();

    this.academicoService.listarPeriodos().subscribe(p => {
      this.notasPeriodos = p;
      const activo = p.find(x => x.activo);
      this.notasIdPeriodo = activo?.id ?? p[0]?.id ?? null;
    });
  }

  // ── Notas ──

  onNotasGradoChange(): void {
    this.notasAlumnos = [];
    this.notasAlumnoIdentidad = null;
    this.notasAlumnoFiltro = '';
    this.reporteNotas = [];
    this.notasBuscado = false;
    if (this.notasIdGrado == null) return;

    this.cargandoAlumnos = true;
    this.academicoService.alumnosPorGrado(this.notasIdGrado).subscribe({
      next: (a) => { this.notasAlumnos = a; this.cargandoAlumnos = false; },
      error: () => { this.cargandoAlumnos = false; this.snack.open('No se pudieron cargar los alumnos', '', { duration: 3000 }); }
    });
  }

  onFiltroAlumnoChange(): void {
    const sel = this.notasAlumnoSeleccionado;
    if (sel && this.notasAlumnoFiltro === sel.nombreCompleto) return; // el texto lo puso la selección
    this.notasAlumnoIdentidad = null;
    this.reporteNotas = [];
    this.notasBuscado = false;
  }

  onAlumnoElegido(a: AlumnoGrado): void {
    this.notasAlumnoIdentidad = a.identidad;
    this.notasAlumnoFiltro = a.nombreCompleto;
    this.cargarReporteNotas();
  }

  cargarReporteNotas(): void {
    if (!this.notasAlumnoIdentidad || this.notasIdPeriodo == null) return;
    this.cargandoNotas = true;
    this.notasBuscado = true;
    this.academicoService.reporteNotasAlumno(this.notasAlumnoIdentidad, this.notasIdPeriodo).subscribe({
      next: (r) => { this.reporteNotas = r; this.cargandoNotas = false; },
      error: () => { this.reporteNotas = []; this.cargandoNotas = false; this.snack.open('No se pudo cargar el reporte de notas', '', { duration: 3000 }); }
    });
  }

  totalClaseNotas(clase: ReporteNotaClase): number {
    return clase.conceptos.reduce((s, c) =>
      s + c.actividades.reduce((sa, a) => sa + (a.nota ?? 0), 0), 0);
  }

  sincronizarZlink(): void {
    this.sincronizando = true;
    this.asistenciaService.sincronizarZlink().subscribe({
      next: (resultado) => {
        this.sincronizando = false;
        this.snack.open(
          `Sincronizado: ${resultado.alumnos} alumnos, ${resultado.empleados} empleados, ${resultado.omitidos} omitidos`,
          '', { duration: 4000 }
        );
        this.cargarAsistencia();
        this.cargarEmpleados();
      },
      error: () => {
        this.sincronizando = false;
        this.snack.open('No se pudo sincronizar con Zlink', '', { duration: 4000 });
      }
    });
  }

  cargarAsistencia(): void {
    this.loadingAsistencia = true;
    this.asistenciaService.getReporteDiario(this.fechaAsistencia, this.filtroIdGrado).subscribe({
      next: (data) => { this.reporteAsistencia = data; this.loadingAsistencia = false; },
      error: () => { this.loadingAsistencia = false; }
    });
  }

  cargarEmpleados(): void {
    this.loadingEmpleados = true;
    this.asistenciaService.getReporteEmpleados(this.fechaEmpleados).subscribe({
      next: (data) => { this.reporteEmpleados = data; this.loadingEmpleados = false; },
      error: () => { this.loadingEmpleados = false; }
    });
  }

  abrirFeriados(): void {
    this.dialog.open(FeriadosDialogComponent, { width: '560px' })
      .afterClosed().subscribe((huboCambios: boolean) => {
        if (huboCambios && this.mensualGenerado) {
          this.generarReporteMensual();
        }
      });
  }

  generarReporteMensual(): void {
    if (this.mensualHasta < this.mensualDesde) {
      this.snack.open('La fecha hasta no puede ser anterior a la fecha desde', '', { duration: 3000 });
      return;
    }
    this.loadingMensual = true;
    this.asistenciaService.getReporteMensualEmpleados({
      desde: this.mensualDesde,
      hasta: this.mensualHasta,
      horaEntrada: this.mensualHoraEntrada,
      toleranciaMinutos: this.mensualTolerancia,
      horaSalida: this.mensualHoraSalida,
      jornadaHoras: this.mensualJornada
    }).subscribe({
      next: (data) => {
        this.reporteMensual = data;
        this.mensualGenerado = true;
        this.loadingMensual = false;
      },
      error: () => {
        this.loadingMensual = false;
        this.snack.open('No se pudo generar el reporte mensual', '', { duration: 4000 });
      }
    });
  }
}
