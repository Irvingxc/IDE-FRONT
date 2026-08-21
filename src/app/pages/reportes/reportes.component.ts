import { Component, OnInit } from '@angular/core';
import { AsistenciaService, AsistenciaReporteItem } from '@app/services/asistencia/asistencia.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';

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

  constructor(
    private asistenciaService: AsistenciaService,
    private catalogoService: CatalogoService
  ) {}

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
    this.cargarAsistencia();
  }

  cargarAsistencia(): void {
    this.loadingAsistencia = true;
    this.asistenciaService.getReporteDiario(this.fechaAsistencia, this.filtroIdGrado).subscribe({
      next: (data) => { this.reporteAsistencia = data; this.loadingAsistencia = false; },
      error: () => { this.loadingAsistencia = false; }
    });
  }
}
