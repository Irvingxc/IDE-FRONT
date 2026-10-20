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
  filtroEstadoAlumno = 'Activo';

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
      this.filtroEstado || undefined,
      this.filtroEstadoAlumno
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
      data: { identidad: row.identidad, nombre: row.nombreCompleto, anio: this.anio, gradoNombre: row.gradoNombre, cliente: row.nombreTutor, esAdmin: this.esAdmin }
    });
  }

  limpiar(): void {
    this.filtroNombre = '';
    this.filtroEstado = '';
    this.filtroEstadoAlumno = 'Activo';
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

  exportando = false;

  /** Excel (.xlsx) con título, fecha del reporte y filtros aplicados. */
  async exportarExcel(): Promise<void> {
    if (this.exportando || this.datos.length === 0) return;
    this.exportando = true;
    try {
      const ExcelJS = (await import('exceljs')).default;
      const libro = new ExcelJS.Workbook();
      const hoja  = libro.addWorksheet(`CxC ${this.anio}`, { views: [{ state: 'frozen', ySplit: 5 }] });

      const hoy = new Date();
      const fecha = hoy.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora  = hoy.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
      const estados: Record<string, string> = { '': 'Todos', Pendiente: 'Con pendientes', AlDia: 'Al día' };
      const filtros = [
        `Estado de cuenta: ${estados[this.filtroEstado] ?? this.filtroEstado}`,
        `Alumnos: ${this.filtroEstadoAlumno === 'Activo' ? 'Activos' : this.filtroEstadoAlumno === 'Inactivo' ? 'Inactivos' : 'Todos'}`,
        this.filtroNombre.trim() ? `Búsqueda: ${this.filtroNombre.trim()}` : '',
      ].filter(f => f).join('   ·   ');

      const columnas = ['Estudiante', 'Estado', 'Padre/Tutor', 'Grado', 'Cuotas Pendientes', 'Total Vencido', 'Total Pagado', 'Total Año'];
      const GUINDA = 'FF6B0F1A';

      hoja.mergeCells(1, 1, 1, columnas.length);
      hoja.getCell(1, 1).value = `Reporte de Cuentas por Cobrar — Año ${this.anio}`;
      hoja.getCell(1, 1).font  = { bold: true, size: 14, color: { argb: GUINDA } };

      hoja.mergeCells(2, 1, 2, columnas.length);
      hoja.getCell(2, 1).value = `Fecha del reporte: ${fecha} ${hora}`;
      hoja.getCell(2, 1).font  = { italic: true, color: { argb: 'FF555555' } };

      hoja.mergeCells(3, 1, 3, columnas.length);
      hoja.getCell(3, 1).value = filtros;
      hoja.getCell(3, 1).font  = { color: { argb: 'FF555555' } };

      const encabezado = hoja.getRow(5);
      encabezado.values = columnas;
      encabezado.eachCell(c => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GUINDA } };
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });

      this.datos.forEach(r => hoja.addRow([
        r.nombreCompleto,
        r.estadoAlumno,
        r.nombreTutor,
        r.gradoNombre,
        r.cuotasPendientes,
        r.totalPendiente,
        r.totalPagado,
        r.totalDeudaAnio,
      ]));

      const ultimaFila = hoja.rowCount;
      const total = hoja.addRow(['Total', '', '', '', null, null, null, null]);
      ['E', 'F', 'G', 'H'].forEach(col => {
        hoja.getCell(`${col}${total.number}`).value = { formula: `SUM(${col}6:${col}${ultimaFila})` };
      });
      total.font = { bold: true };
      total.eachCell(c => c.border = { top: { style: 'thin' } });

      const anchos = [38, 12, 34, 18, 12, 16, 16, 16];
      anchos.forEach((w, i) => hoja.getColumn(i + 1).width = w);
      ['F', 'G', 'H'].forEach(col => hoja.getColumn(col).numFmt = '"L." #,##0.00');
      hoja.getColumn('E').alignment = { horizontal: 'center' };
      hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: ultimaFila, column: columnas.length } };

      const buffer = await libro.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Reporte CxC ${this.anio} - ${fecha.replace(/\//g, '-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.snack.open('No se pudo generar el Excel', '', { duration: 4000 });
    } finally {
      this.exportando = false;
    }
  }
}
