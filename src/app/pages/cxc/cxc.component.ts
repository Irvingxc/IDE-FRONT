import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CxcService, CxcResumen, CxcGeneracion, CxcAlumnoValidacion, CxcRevision } from '@app/services/cxc/cxc.service';
import { EstadoCuentaDialogComponent } from './estado-cuenta-dialog/estado-cuenta-dialog.component';

@Component({
  selector: 'app-cxc',
  templateUrl: './cxc.component.html',
  styleUrls: ['./cxc.component.scss']
})
export class CxcComponent implements OnInit {

  columns = ['nombre', 'grado', 'cuotasPendientes', 'totalPendiente', 'totalPagado'];
  datos: CxcResumen[] = [];
  cargando      = false;
  generando     = false;
  anio          = new Date().getFullYear();
  filtroNombre  = '';
  filtroEstado  = '';

  aniosGenerados = new Map<number, CxcGeneracion>();
  readonly aniosDisponibles: number[] = (() => {
    const base = new Date().getFullYear();
    return [base - 2, base - 1, base, base + 1];
  })();

  esAdmin = false;

  // Resultado de la última generación / recálculo (para el panel de avisos)
  validacion: CxcAlumnoValidacion[] = [];
  revision: CxcRevision[] = [];
  avisoAnio: number | null = null;

  constructor(
    private cxcService: CxcService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private store: Store<fromRoot.State>
  ) {}

  ngOnInit(): void {
    this.store.pipe(select(fromUser.getUserState)).subscribe(u => {
      const roles: string[] = (u?.entity as any)?.roles ?? [];
      this.esAdmin = roles.some((r: string) => r === 'Administrador' || r === 'Director');
    });
    this.cargar();
    this.cargarAniosGenerados();
  }

  cargarAniosGenerados(): void {
    this.cxcService.getAniosGenerados().subscribe({
      next: (lista) => {
        this.aniosGenerados = new Map((lista ?? []).map(g => [g.anio, g]));
      }
    });
  }

  estaGenerado(anio: number): boolean {
    return this.aniosGenerados.has(anio);
  }

  cargar(): void {
    this.cargando = true;
    this.cxcService.getResumen(
      this.anio,
      this.filtroNombre || undefined,
      this.filtroEstado || undefined
    ).subscribe({
      next: (data) => { this.datos = data ?? []; this.cargando = false; },
      error: ()     => { this.cargando = false; }
    });
  }

  rowClass(row: CxcResumen): string {
    if (row.cuotasPendientes > 3) return 'fila-roja';
    if (row.cuotasPendientes > 0) return 'fila-amarilla';
    return '';
  }

  generarCxc(anioSeleccionado: number): void {
    if (this.generando) return;

    const yaGenerado = this.estaGenerado(anioSeleccionado);
    if (yaGenerado &&
        !confirm(`El año ${anioSeleccionado} ya tiene CxC generada. ` +
                 `Volver a ejecutar solo agrega las cuotas de alumnos nuevos (no reescribe las existentes). ¿Continuar?`)) {
      return;
    }

    this.generando = true;
    this.limpiarAvisos();
    this.cxcService.generarAnio(anioSeleccionado).subscribe({
      next: (validacion) => {
        this.generando = false;
        this.cargarAniosGenerados();
        this.validacion = validacion ?? [];
        this.avisoAnio = anioSeleccionado;
        this.snack.open(
          this.validacion.length
            ? `CxC ${anioSeleccionado} generada. ${this.validacion.length} alumno(s) con cuotas incompletas — revisá el aviso.`
            : `CxC ${anioSeleccionado} generada correctamente`,
          '', { duration: 5000 });
        if (this.anio === anioSeleccionado) this.cargar();
      },
      error: (err) => {
        this.generando = false;
        const msg = err?.error?.errores?.mensaje ?? err?.error?.mensaje ?? 'Error al generar CxC';
        this.snack.open(msg, 'OK', { duration: 8000 });
      }
    });
  }

  recalcularCxc(anioSeleccionado: number): void {
    if (this.generando) return;
    if (!confirm(`Recalcular CxC ${anioSeleccionado}: reajusta grado y monto de las cuotas ` +
                 `PENDIENTES según el catálogo y la matrícula del año, y agrega las faltantes. ` +
                 `No toca cuotas pagadas. ¿Continuar?`)) return;

    this.generando = true;
    this.limpiarAvisos();
    this.cxcService.recalcularAnio(anioSeleccionado).subscribe({
      next: (revision) => {
        this.generando = false;
        this.cargarAniosGenerados();
        this.revision = revision ?? [];
        this.avisoAnio = anioSeleccionado;
        this.snack.open(
          this.revision.length
            ? `CxC ${anioSeleccionado} recalculada. ${this.revision.length} cuota(s) de alumnos no activos para revisar.`
            : `CxC ${anioSeleccionado} recalculada correctamente`,
          '', { duration: 5000 });
        if (this.anio === anioSeleccionado) this.cargar();
      },
      error: (err) => {
        this.generando = false;
        const msg = err?.error?.errores?.mensaje ?? err?.error?.mensaje ?? 'Error al recalcular CxC';
        this.snack.open(msg, 'OK', { duration: 8000 });
      }
    });
  }

  limpiarAvisos(): void {
    this.validacion = [];
    this.revision = [];
    this.avisoAnio = null;
  }

  abrirEstadoCuenta(row: CxcResumen): void {
    this.dialog.open(EstadoCuentaDialogComponent, {
      width: '1000px',
      data: { identidad: row.identidad, nombre: row.nombreCompleto, anio: this.anio, gradoNombre: row.gradoNombre, esAdmin: this.esAdmin }
    });
  }

  limpiar(): void {
    this.filtroNombre = '';
    this.filtroEstado = '';
    this.cargar();
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalPendienteGlobal(): number {
    return this.datos.reduce((s, r) => s + r.totalPendiente, 0);
  }

  get totalPagadoGlobal(): number {
    return this.datos.reduce((s, r) => s + r.totalPagado, 0);
  }

  exportarExcel(): void {
    const lps = (v: number) => v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const headers = ['Estudiante', 'Padre/Tutor', 'Grado', 'Cuotas Pendientes', 'Total Vencido', 'Total Pagado', 'Total Año'];
    const rows = this.datos.map(r => [
      r.nombreCompleto,
      r.nombreTutor,
      r.gradoNombre,
      r.cuotasPendientes,
      lps(r.totalPendiente),
      lps(r.totalPagado),
      lps(r.totalDeudaAnio),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `CXC_${this.anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
