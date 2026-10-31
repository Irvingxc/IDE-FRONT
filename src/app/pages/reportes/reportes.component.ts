import { Component, OnInit } from '@angular/core';
import { AsistenciaService, AsistenciaReporteItem, EmpleadoReporteItem, EmpleadoReporteMensualItem } from '@app/services/asistencia/asistencia.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { FeriadosDialogComponent } from './feriados-dialog/feriados-dialog.component';
import { nivelDesempeno, SIN_CALIFICAR, tieneNotas } from '@app/utils/nivel-desempeno';
import {
  AcademicoService, PeriodoResponse, AlumnoGrado, ReporteNotaClase, AvanceNotasClase
} from '@app/services/academico/academico.service';

type EstadoAvance = 'completa' | 'proceso' | 'sin';

interface AvanceDocente {
  clave:      string;
  nombre:     string;
  clases:     AvanceNotasClase[];
  cargadas:   number;
  esperadas:  number;
  completas:  number;
  enProceso:  number;
  sinNotas:   number;
}

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
  notasSeccion: string | null = null;
  notasAlumnos: AlumnoGrado[] = [];
  notasAlumnoIdentidad: string | null = null;
  notasAlumnoFiltro = '';
  cargandoAlumnos = false;
  cargandoNotas = false;
  notasBuscado = false;
  reporteNotas: ReporteNotaClase[] = [];

  private seccionDe(a: AlumnoGrado): string {
    return a.seccion?.trim() || '—';
  }

  get notasSecciones(): string[] {
    return Array.from(new Set(this.notasAlumnos.map(a => this.seccionDe(a)))).sort();
  }

  get notasAlumnosFiltrados(): AlumnoGrado[] {
    let list = this.notasAlumnos;
    if (this.notasSeccion) list = list.filter(a => this.seccionDe(a) === this.notasSeccion);
    const q = this.notasAlumnoFiltro.trim().toLowerCase();
    if (q) list = list.filter(a => a.nombreCompleto.toLowerCase().includes(q));
    return list;
  }

  get notasAlumnoSeleccionado(): AlumnoGrado | null {
    return this.notasAlumnos.find(a => a.identidad === this.notasAlumnoIdentidad) ?? null;
  }

  get filtrosNotasCompletos(): boolean {
    return this.notasIdGrado != null
        && this.notasSeccion != null
        && this.notasAlumnoIdentidad != null
        && this.notasIdPeriodo != null;
  }

  // ── Avance de notas (por docente) ────────────────────────
  avanceIdPeriodo: number | null = null;
  avanceMaestro = '';                       // clave del docente; '' = todos
  avanceEstado: '' | EstadoAvance = '';
  avanceClases: AvanceNotasClase[] = [];
  cargandoAvance = false;
  avanceBuscado = false;
  avanceAbiertas = new Set<number>();
  exportandoAvance = false;

  private claveDocente(c: AvanceNotasClase): string {
    return c.idMaestro ?? '';
  }

  /** % de notas cargadas; las clases sin alumnos o sin actividades cuentan como 0. */
  porcentajeAvance(cargadas: number, esperadas: number): number {
    return esperadas > 0 ? Math.round((cargadas / esperadas) * 100) : 0;
  }

  estadoAvance(c: AvanceNotasClase): EstadoAvance {
    if (c.notasCargadas === 0) return 'sin';
    return c.notasEsperadas > 0 && c.notasCargadas >= c.notasEsperadas ? 'completa' : 'proceso';
  }

  grupoClase(c: AvanceNotasClase): string {
    const partes = [c.gradoNombre, c.seccion ? `Sección ${c.seccion}` : null, c.nivelInglesNombre].filter(p => p);
    return partes.join(' · ') || '—';
  }

  // Se calculan al cargar y al cambiar un filtro (no como getters: el template
  // recibiría arreglos nuevos en cada detección de cambios y redibujaría todo).
  avanceDocentesOpciones: { clave: string; nombre: string }[] = [];
  avanceDocentes: AvanceDocente[] = [];
  avanceTotales = { clases: 0, completas: 0, enProceso: 0, sinNotas: 0, porcentaje: 0 };

  recalcularAvance(): void {
    const mapa = new Map<string, string>();
    this.avanceClases.forEach(c => mapa.set(this.claveDocente(c), c.maestroNombre || 'Sin docente asignado'));
    this.avanceDocentesOpciones = Array.from(mapa, ([clave, nombre]) => ({ clave, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const grupos = new Map<string, AvanceDocente>();
    for (const c of this.avanceClases) {
      const clave = this.claveDocente(c);
      if (this.avanceMaestro && clave !== this.avanceMaestro) continue;
      if (this.avanceEstado && this.estadoAvance(c) !== this.avanceEstado) continue;

      let g = grupos.get(clave);
      if (!g) {
        g = { clave, nombre: c.maestroNombre || 'Sin docente asignado', clases: [],
              cargadas: 0, esperadas: 0, completas: 0, enProceso: 0, sinNotas: 0 };
        grupos.set(clave, g);
      }
      g.clases.push(c);
      g.cargadas  += c.notasCargadas;
      g.esperadas += c.notasEsperadas;
      const e = this.estadoAvance(c);
      if (e === 'completa') g.completas++;
      else if (e === 'proceso') g.enProceso++;
      else g.sinNotas++;
    }
    const docentes = Array.from(grupos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.avanceDocentes = docentes;

    const suma = (f: (d: AvanceDocente) => number) => docentes.reduce((s, d) => s + f(d), 0);
    this.avanceTotales = {
      clases:     suma(d => d.clases.length),
      completas:  suma(d => d.completas),
      enProceso:  suma(d => d.enProceso),
      sinNotas:   suma(d => d.sinNotas),
      porcentaje: this.porcentajeAvance(suma(d => d.cargadas), suma(d => d.esperadas)),
    };
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
      this.avanceIdPeriodo = this.notasIdPeriodo;
    });
  }

  // ── Avance de notas ──

  /** Se carga la primera vez que se abre la pestaña. */
  onTabChange(e: MatTabChangeEvent): void {
    if (e.tab.textLabel === 'Avance de notas' && !this.avanceBuscado) this.cargarAvanceNotas();
  }

  cargarAvanceNotas(): void {
    if (this.avanceIdPeriodo == null) return;
    this.cargandoAvance = true;
    this.avanceBuscado = true;
    this.avanceAbiertas.clear();
    this.academicoService.reporteAvanceNotas(this.avanceIdPeriodo).subscribe({
      next: (r) => {
        this.avanceClases = r;
        if (this.avanceMaestro && !r.some(c => this.claveDocente(c) === this.avanceMaestro)) this.avanceMaestro = '';
        this.recalcularAvance();
        this.cargandoAvance = false;
      },
      error: (err) => {
        this.avanceClases = [];
        this.recalcularAvance();
        this.cargandoAvance = false;
        this.snack.open(err.error?.errores?.mensaje ?? 'No se pudo cargar el avance de notas', '', { duration: 3000 });
      }
    });
  }

  toggleAvanceClase(idClase: number): void {
    if (this.avanceAbiertas.has(idClase)) this.avanceAbiertas.delete(idClase);
    else this.avanceAbiertas.add(idClase);
  }

  /** Excel con una fila por clase (respeta los filtros de docente y estado). */
  async exportarAvanceExcel(): Promise<void> {
    const docentes = this.avanceDocentes;
    if (this.exportandoAvance || docentes.length === 0) return;
    this.exportandoAvance = true;
    try {
      const ExcelJS = (await import('exceljs')).default;
      const libro = new ExcelJS.Workbook();
      const hoja  = libro.addWorksheet('Avance de notas', { views: [{ state: 'frozen', ySplit: 5 }] });

      const periodo = this.notasPeriodos.find(p => p.id === this.avanceIdPeriodo);
      const hoy = new Date();
      const fecha = hoy.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora  = hoy.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
      const estados: Record<string, string> = { '': 'Todos', completa: 'Completas', proceso: 'En proceso', sin: 'Sin notas' };
      const docenteSel = this.avanceDocentesOpciones.find(d => d.clave === this.avanceMaestro)?.nombre;
      const filtros = [`Docente: ${this.avanceMaestro ? docenteSel : 'Todos'}`, `Estado: ${estados[this.avanceEstado]}`].join('   ·   ');

      const columnas = ['Docente', 'Clase', 'Grado / Sección', 'Alumnos', 'Actividades', 'Notas cargadas', 'Notas esperadas', '% avance', 'Estado', 'Última carga'];
      const GUINDA = 'FF6B0F1A';

      hoja.mergeCells(1, 1, 1, columnas.length);
      hoja.getCell(1, 1).value = `Avance de carga de notas — ${periodo?.nombre ?? 'Período'}`;
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

      const nombresEstado: Record<EstadoAvance, string> = { completa: 'Completa', proceso: 'En proceso', sin: 'Sin notas' };
      docentes.forEach(d => d.clases.forEach(c => hoja.addRow([
        d.nombre,
        c.claseNombre,
        this.grupoClase(c),
        c.alumnos,
        c.actividades,
        c.notasCargadas,
        c.notasEsperadas,
        this.porcentajeAvance(c.notasCargadas, c.notasEsperadas) / 100,
        nombresEstado[this.estadoAvance(c)],
        c.ultimaCarga ? new Date(c.ultimaCarga).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' }) : '—',
      ])));

      const anchos = [32, 26, 40, 10, 12, 14, 14, 11, 13, 18];
      anchos.forEach((w, i) => hoja.getColumn(i + 1).width = w);
      hoja.getColumn('H').numFmt = '0%';
      ['D', 'E', 'F', 'G', 'H', 'I'].forEach(col => hoja.getColumn(col).alignment = { horizontal: 'center' });
      hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: hoja.rowCount, column: columnas.length } };

      const buffer = await libro.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Avance de notas ${periodo?.nombre ?? ''} - ${fecha.replace(/\//g, '-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.snack.open('No se pudo generar el Excel', '', { duration: 4000 });
    } finally {
      this.exportandoAvance = false;
    }
  }

  // ── Notas ──

  onNotasGradoChange(): void {
    this.notasAlumnos = [];
    this.notasSeccion = null;
    this.notasAlumnoIdentidad = null;
    this.notasAlumnoFiltro = '';
    this.reporteNotas = [];
    this.notasBuscado = false;
    if (this.notasIdGrado == null) return;

    this.cargandoAlumnos = true;
    // Si el parcial elegido es de un año lectivo anterior, listar los alumnos que
    // estuvieron en ese grado ese año (histórico), no los que están hoy.
    const anioSel = this.notasPeriodos.find(p => p.id === this.notasIdPeriodo)?.anioLectivo;
    const anioActual = new Date().getFullYear();
    const anioHistorico = anioSel != null && anioSel < anioActual ? anioSel : undefined;
    this.academicoService.alumnosPorGrado(this.notasIdGrado, anioHistorico).subscribe({
      next: (a) => {
        this.notasAlumnos = a;
        this.cargandoAlumnos = false;
        // Si el grado tiene una sola sección, la deja seleccionada
        if (this.notasSecciones.length === 1) this.notasSeccion = this.notasSecciones[0];
      },
      error: (err) => { this.cargandoAlumnos = false; this.snack.open(err.error?.errores?.mensaje ?? 'No se pudieron cargar los alumnos', '', { duration: 3000 }); }
    });
  }

  onNotasSeccionChange(): void {
    this.notasAlumnoIdentidad = null;
    this.notasAlumnoFiltro = '';
    this.reporteNotas = [];
    this.notasBuscado = false;
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
      error: (err) => { this.reporteNotas = []; this.cargandoNotas = false; this.snack.open(err.error?.errores?.mensaje ?? 'No se pudo cargar el reporte de notas', '', { duration: 3000 }); }
    });
  }

  totalClaseNotas(clase: ReporteNotaClase): number {
    return clase.conceptos.reduce((s, c) =>
      s + c.actividades.reduce((sa, a) => sa + (a.nota ?? 0), 0), 0);
  }

  /** Promedio de las clases con al menos una nota; null si ninguna tiene notas. */
  get promedioNotas(): number | null {
    const calificadas = this.reporteNotas.filter(tieneNotas);
    if (!calificadas.length) return null;
    return calificadas.reduce((s, c) => s + this.totalClaseNotas(c), 0) / calificadas.length;
  }

  descargandoNotasPdf = false;

  /**
   * Genera y descarga un PDF con el resumen de notas del alumno filtrado
   * (mismo formato que el PDF del Portal de Padres).
   */
  async descargarNotasPdf(): Promise<void> {
    const alumno = this.notasAlumnoSeleccionado;
    if (this.descargandoNotasPdf || !alumno || this.reporteNotas.length === 0) return;
    this.descargandoNotasPdf = true;
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const GUINDA: [number, number, number] = [107, 15, 26];
      const CREMA:  [number, number, number] = [250, 246, 240];
      const periodo = this.notasPeriodos.find(p => p.id === this.notasIdPeriodo);
      const gradoNombre = this.grados.find(g => g.idGrado === this.notasIdGrado)?.gradoNombre ?? '—';
      const anioLectivo = periodo?.anioLectivo ?? new Date().getFullYear();

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 48;

      // ── Cabecera ──
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GUINDA);
      doc.setFontSize(14);
      doc.text(`Reporte de Notas · ${periodo?.nombre ?? 'Período'}`, pageW / 2, 52, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(
        'Institute for the Development of Excellence (IDE) · Danlí, El Paraíso, Honduras',
        pageW / 2, 68, { align: 'center' });

      doc.setDrawColor(...GUINDA);
      doc.setLineWidth(1.5);
      doc.line(M, 78, pageW - M, 78);

      // ── Datos del estudiante ──
      let y = 100;
      const info: [string, string][] = [
        ['Estudiante:',       alumno.nombreCompleto],
        ['Identidad:',        alumno.identidad],
        ['Grado:',            gradoNombre],
        ['Sección:',          alumno.seccion ?? '—'],
        ['Año lectivo:',      String(anioLectivo)],
        ['Fecha de emisión:', new Date().toLocaleDateString('es-HN')],
      ];
      if (alumno.nivelIngles) info.splice(4, 0, ['Nivel de inglés:', alumno.nivelIngles]);
      doc.setFontSize(10);
      info.forEach(([label, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GUINDA);
        doc.text(label, M, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30);
        doc.text(valor, M + 110, y);
        y += 16;
      });

      // ── Tabla resumen ──
      const filas = this.reporteNotas.map(c => tieneNotas(c)
        ? [c.claseNombre, c.maestroNombre || '—', `${this.totalClaseNotas(c).toFixed(2)} / 100`, nivelDesempeno(this.totalClaseNotas(c))]
        : [c.claseNombre, c.maestroNombre || '—', '—', SIN_CALIFICAR]);

      autoTable(doc, {
        startY: y + 10,
        head: [['Materia', 'Maestro', 'Nota', 'Nivel de desempeño']],
        body: filas,
        styles:            { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: 40, lineColor: [230, 224, 216], lineWidth: 0.5 },
        headStyles:        { fillColor: GUINDA, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles:{ fillColor: CREMA },
        columnStyles:      { 2: { halign: 'right' }, 3: { halign: 'center' } },
        margin:            { left: M, right: M },
        didParseCell: (d: any) => {
          if (d.section !== 'body' || d.column.index !== 3) return;
          if (d.cell.raw === 'Inicial') { d.cell.styles.textColor = [198, 40, 40]; d.cell.styles.fontStyle = 'bold'; }
          if (d.cell.raw === SIN_CALIFICAR) { d.cell.styles.textColor = 140; d.cell.styles.fontStyle = 'italic'; }
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY as number;

      // ── Promedio ──
      const promedio = this.promedioNotas;
      doc.setDrawColor(...GUINDA);
      doc.setLineWidth(1.5);
      doc.line(M, finalY + 14, pageW - M, finalY + 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...GUINDA);
      doc.text('Promedio del período:', pageW - M - 260, finalY + 33);
      doc.text(promedio === null ? SIN_CALIFICAR : `${promedio.toFixed(2)} / 100 · ${nivelDesempeno(promedio)}`,
        pageW - M, finalY + 33, { align: 'right' });

      // ── Pie ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text('ETHICS · SCIENCE · TECHNOLOGY', pageW / 2, pageH - 28, { align: 'center' });

      const limpio = (s: string) => (s || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ');
      doc.save(`NOTAS ${limpio(alumno.nombreCompleto)} ${limpio(periodo?.nombre ?? 'PERIODO')}.pdf`);
    } finally {
      this.descargandoNotasPdf = false;
    }
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
