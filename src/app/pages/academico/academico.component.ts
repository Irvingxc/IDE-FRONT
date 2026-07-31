import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AcademicoService, PeriodoResponse, ClaseResponse, SemanaResponse, EvaluacionResponse } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PeriodoDialogComponent } from './periodo-dialog/periodo-dialog.component';
import { ClaseDialogComponent } from './clase-dialog/clase-dialog.component';
import { EvaluacionDialogComponent } from './evaluacion-dialog/evaluacion-dialog.component';
import { NotasDialogComponent } from './notas-dialog/notas-dialog.component';

@Component({
  selector: 'app-academico',
  templateUrl: './academico.component.html',
  styleUrls: ['./academico.component.scss']
})
export class AcademicoComponent implements OnInit {
  anioLectivo = new Date().getFullYear();

  periodos: PeriodoResponse[] = [];
  loadingPeriodos = true;
  columnasPeriodos = ['nombre', 'fechaDesde', 'fechaHasta', 'anioLectivo', 'acciones'];

  clases: ClaseResponse[] = [];
  loadingClases = true;
  columnasClases = ['nombre', 'gradoNombre', 'maestroNombre', 'acciones'];

  // ── Notas ─────────────────────────────────────────────────
  notasIdClase: number | null = null;
  notasIdPeriodo: number | null = null;
  semanas: SemanaResponse[] = [];
  evaluacionesPorSemana: { [idSemana: number]: EvaluacionResponse[] } = {};
  loadingSemanas = false;

  constructor(
    private academicoService: AcademicoService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarClases();
  }

  // ── Periodos ──────────────────────────────────────────────
  cargarPeriodos(): void {
    this.loadingPeriodos = true;
    this.academicoService.listarPeriodos(this.anioLectivo).subscribe({
      next: (data) => { this.periodos = data; this.loadingPeriodos = false; },
      error: () => { this.loadingPeriodos = false; }
    });
  }

  nuevoPeriodo(): void {
    const ref = this.dialog.open(PeriodoDialogComponent, {
      width: '460px',
      data: { anioLectivo: this.anioLectivo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarPeriodos(); });
  }

  editarPeriodo(periodo: PeriodoResponse): void {
    const ref = this.dialog.open(PeriodoDialogComponent, {
      width: '460px',
      data: { periodo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarPeriodos(); });
  }

  inactivarPeriodo(periodo: PeriodoResponse): void {
    if (!confirm(`¿Inactivar el periodo "${periodo.nombre}"?`)) return;
    this.academicoService.inactivarPeriodo(periodo.id).subscribe({
      next: () => {
        this.notification.success('Periodo inactivado correctamente');
        this.cargarPeriodos();
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar el periodo');
      }
    });
  }

  // ── Clases ────────────────────────────────────────────────
  cargarClases(): void {
    this.loadingClases = true;
    this.academicoService.listarClases(this.anioLectivo).subscribe({
      next: (data) => { this.clases = data; this.loadingClases = false; },
      error: () => { this.loadingClases = false; }
    });
  }

  nuevaClase(): void {
    const ref = this.dialog.open(ClaseDialogComponent, {
      width: '460px',
      data: { anioLectivo: this.anioLectivo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarClases(); });
  }

  editarClase(clase: ClaseResponse): void {
    const ref = this.dialog.open(ClaseDialogComponent, {
      width: '460px',
      data: { clase }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarClases(); });
  }

  inactivarClase(clase: ClaseResponse): void {
    if (!confirm(`¿Inactivar la clase "${clase.nombre}"?`)) return;
    this.academicoService.inactivarClase(clase.id).subscribe({
      next: () => {
        this.notification.success('Clase inactivada correctamente');
        this.cargarClases();
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar la clase');
      }
    });
  }

  // ── Notas ─────────────────────────────────────────────────
  onNotasFiltroChange(): void {
    this.semanas = [];
    this.evaluacionesPorSemana = {};
    if (!this.notasIdClase || !this.notasIdPeriodo) return;

    this.loadingSemanas = true;
    this.academicoService.listarSemanas(this.notasIdPeriodo).subscribe({
      next: (data) => {
        this.semanas = data;
        this.loadingSemanas = false;
        this.semanas.forEach(s => this.cargarEvaluaciones(s.id));
      },
      error: () => { this.loadingSemanas = false; }
    });
  }

  cargarEvaluaciones(idSemana: number): void {
    if (!this.notasIdClase) return;
    this.academicoService.listarEvaluaciones(this.notasIdClase, idSemana).subscribe(data => {
      this.evaluacionesPorSemana[idSemana] = data;
    });
  }

  nuevaEvaluacion(semana: SemanaResponse): void {
    if (!this.notasIdClase) return;
    const ref = this.dialog.open(EvaluacionDialogComponent, {
      width: '400px',
      data: { idSemana: semana.id, idClase: this.notasIdClase }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarEvaluaciones(semana.id); });
  }

  abrirNotas(evaluacion: EvaluacionResponse): void {
    this.dialog.open(NotasDialogComponent, {
      width: '600px',
      data: { evaluacion }
    });
  }

  inactivarEvaluacion(evaluacion: EvaluacionResponse): void {
    if (!confirm(`¿Inactivar la evaluación "${evaluacion.nombre}"?`)) return;
    this.academicoService.inactivarEvaluacion(evaluacion.id).subscribe({
      next: () => {
        this.notification.success('Evaluación inactivada correctamente');
        this.cargarEvaluaciones(evaluacion.idSemana);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar la evaluación');
      }
    });
  }
}
