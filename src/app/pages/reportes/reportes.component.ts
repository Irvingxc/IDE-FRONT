import { Component, OnInit } from '@angular/core';
import { AsistenciaService, AsistenciaReporteItem, EmpleadoReporteItem } from '@app/services/asistencia/asistencia.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  // ── Sincronizacion con Zlink (compartida por ambos tabs) ──
  sincronizando = false;

  constructor(
    private asistenciaService: AsistenciaService,
    private catalogoService: CatalogoService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
    this.cargarAsistencia();
    this.cargarEmpleados();
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
}
