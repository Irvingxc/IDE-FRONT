import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import {
  PortalClienteService, HijoDto, PortalFacturaDto, PortalCxcDto, PortalPeriodo, PortalClaseNota, PortalAsistenciaDto
} from '@app/services/portal-cliente/portal-cliente.service';
import { TokenService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { CambiarPasswordDialogComponent } from '@app/components/cambiar-password-dialog/cambiar-password-dialog.component';

@Component({
  selector: 'app-portal-cliente',
  templateUrl: './portal-cliente.component.html',
  styleUrls: ['./portal-cliente.component.scss']
})
export class PortalClienteComponent implements OnInit {

  user$!: Observable<any>;

  hijos: HijoDto[] = [];
  hijoSeleccionado: HijoDto | null = null;

  facturas: PortalFacturaDto[] = [];
  cxc: PortalCxcDto[] = [];
  anio = new Date().getFullYear();
  anios: number[] = [];

  notas: PortalClaseNota[] = [];
  periodos: PortalPeriodo[] = [];
  periodoSeleccionadoId: number | null = null;

  asistencia: PortalAsistenciaDto[] = [];
  anioAsistencia = new Date().getFullYear();
  mesAsistencia = new Date().getMonth() + 1;
  readonly meses = Array.from({ length: 12 }, (_, i) => i + 1);

  cargandoHijos    = true;
  cargandoFacturas = false;
  cargandoCxc      = false;
  cargandoNotas    = false;
  cargandoAsistencia = false;

  tabActiva = 0;

  readonly cxcColumns  = ['mes', 'producto', 'monto', 'vence', 'estado', 'fechaPago'];
  readonly facColumns  = ['noFactura', 'fecha', 'total', 'estado'];
  readonly asistenciaColumns = ['fecha', 'estado', 'horaMarca'];

  descargandoPdf = false;

  constructor(
    private store: Store<fromRoot.State>,
    private router: Router,
    public svc: PortalClienteService,
    private tokenService: TokenService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user$ = this.store.pipe(select(fromUser.getUser));
    const base = this.anio;
    this.anios = [base, base - 1, base - 2];

    this.svc.misHijos().subscribe({
      next: (h) => {
        this.hijos = h;
        this.cargandoHijos = false;
        if (h.length > 0) this.seleccionar(h[0]);
      },
      error: () => { this.cargandoHijos = false; }
    });

    this.svc.periodos().subscribe({
      next: (p) => {
        this.periodos = p;
        if (p.length > 0) {
          this.periodoSeleccionadoId = p[0].id;
          this.cargarNotas();
        }
      },
      error: () => {}
    });
  }

  seleccionar(hijo: HijoDto): void {
    this.hijoSeleccionado = hijo;
    this.cargarCxc();
    this.cargarNotas();
    this.cargarAsistencia();
  }

  cambiarPassword(): void {
    this.dialog.open(CambiarPasswordDialogComponent, { width: '420px' });
  }

  cerrarSesion(): void {
    this.tokenService.clear();
    this.store.dispatch(new fromUser.SignOut());
    this.router.navigate(['/']);
  }

  cargarFacturas(): void {
    this.cargandoFacturas = true;
    this.svc.misFacturas(this.hijoSeleccionado?.identidad).subscribe({
      next: (f) => { this.facturas = f; this.cargandoFacturas = false; },
      error: () => { this.cargandoFacturas = false; }
    });
  }

  cargarCxc(): void {
    this.cargandoCxc = true;
    this.svc.miCXC(this.hijoSeleccionado?.identidad, this.anio).subscribe({
      next: (c) => { this.cxc = c; this.cargandoCxc = false; },
      error: () => { this.cargandoCxc = false; }
    });
  }

  cambiarAnio(a: number): void {
    this.anio = a;
    this.cargarCxc();
  }

  cargarNotas(): void {
    if (!this.hijoSeleccionado || !this.periodoSeleccionadoId) { this.notas = []; return; }
    this.cargandoNotas = true;
    this.svc.misNotas(this.hijoSeleccionado.identidad, this.periodoSeleccionadoId).subscribe({
      next: (n) => { this.notas = n; this.cargandoNotas = false; },
      error: () => { this.notas = []; this.cargandoNotas = false; }
    });
  }

  cambiarPeriodo(idPeriodo: number): void {
    this.periodoSeleccionadoId = idPeriodo;
    this.cargarNotas();
  }

  cargarAsistencia(): void {
    if (!this.hijoSeleccionado) { this.asistencia = []; return; }
    this.cargandoAsistencia = true;
    this.svc.miAsistencia(this.hijoSeleccionado.identidad, this.anioAsistencia, this.mesAsistencia).subscribe({
      next: (a) => { this.asistencia = a; this.cargandoAsistencia = false; },
      error: () => { this.asistencia = []; this.cargandoAsistencia = false; }
    });
  }

  cambiarMesAsistencia(mes: number): void {
    this.mesAsistencia = mes;
    this.cargarAsistencia();
  }

  cambiarAnioAsistencia(anio: number): void {
    this.anioAsistencia = anio;
    this.cargarAsistencia();
  }

  get totalPresentesAsistencia(): number {
    return this.asistencia.filter(a => a.estado === 'Presente').length;
  }

  get totalAusentesAsistencia(): number {
    return this.asistencia.filter(a => a.estado === 'Ausente').length;
  }

  totalClase(clase: PortalClaseNota): number {
    return clase.conceptos.reduce((sumaConceptos, concepto) =>
      sumaConceptos + concepto.actividades.reduce((sumaActividades, actividad) =>
        sumaActividades + (actividad.nota ?? 0), 0), 0);
  }

  get promedioNotas(): number {
    if (!this.notas.length) return 0;
    return this.notas.reduce((s, c) => s + this.totalClase(c), 0) / this.notas.length;
  }

  /**
   * Genera y descarga (automatico) un PDF con el resumen de notas del periodo
   * seleccionado, siguiendo el formato institucional (guinda, carta, cabecera IDE).
   */
  async descargarNotas(): Promise<void> {
    if (this.descargandoPdf || !this.hijoSeleccionado || this.notas.length === 0) return;
    this.descargandoPdf = true;
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const GUINDA: [number, number, number] = [107, 15, 26];
      const CREMA:  [number, number, number] = [250, 246, 240];
      const periodo = this.periodos.find(p => p.id === this.periodoSeleccionadoId);
      const anioLectivo = periodo?.anioLectivo ?? this.anio;

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 48;

      // ── Cabecera ────────────────────────────────
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

      // ── Datos del estudiante ────────────────────
      let y = 100;
      const info: [string, string][] = [
        ['Estudiante:',        this.hijoSeleccionado.nombreCompleto],
        ['Identidad:',         this.hijoSeleccionado.identidad],
        ['Grado:',             this.hijoSeleccionado.grado ?? '—'],
        ['Año lectivo:',       String(anioLectivo)],
        ['Fecha de emisión:',  new Date().toLocaleDateString('es-HN')],
      ];
      doc.setFontSize(10);
      info.forEach(([label, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GUINDA);
        doc.text(label, M, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30);
        doc.text(valor, M + 96, y);
        y += 16;
      });

      // ── Tabla resumen ───────────────────────────
      const filas = this.notas.map(c => [
        c.claseNombre,
        c.maestroNombre || '—',
        `${this.totalClase(c).toFixed(2)} / 100`,
        this.totalClase(c) >= 70 ? 'Aprobado' : 'Reprobado',
      ]);

      autoTable(doc, {
        startY: y + 10,
        head: [['Materia', 'Maestro', 'Nota', 'Estado']],
        body: filas,
        styles:            { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: 40, lineColor: [230, 224, 216], lineWidth: 0.5 },
        headStyles:        { fillColor: GUINDA, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles:{ fillColor: CREMA },
        columnStyles:      { 2: { halign: 'right' }, 3: { halign: 'center' } },
        margin:            { left: M, right: M },
      });

      const finalY = (doc as any).lastAutoTable.finalY as number;

      // ── Promedio ────────────────────────────────
      doc.setDrawColor(...GUINDA);
      doc.setLineWidth(1.5);
      doc.line(M, finalY + 14, pageW - M, finalY + 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...GUINDA);
      doc.text('Promedio del período:', pageW - M - 185, finalY + 33);
      doc.text(`${this.promedioNotas.toFixed(2)} / 100`, pageW - M, finalY + 33, { align: 'right' });

      // ── Pie ─────────────────────────────────────
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text('ETHICS · SCIENCE · TECHNOLOGY', pageW / 2, pageH - 28, { align: 'center' });

      const limpio = (s: string) => (s || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ');
      doc.save(`NOTAS ${limpio(this.hijoSeleccionado.nombreCompleto)} ${limpio(periodo?.nombre ?? 'PERIODO')}.pdf`);
    } finally {
      this.descargandoPdf = false;
    }
  }

  // Nombre corto (primeras dos palabras) para las pills del selector de hijos en movil,
  // donde el nombre completo no cabe. Entre hermanos alcanza para distinguirlos.
  nombreCorto(hijo: HijoDto): string {
    return (hijo.nombreCompleto || '').split(/\s+/).slice(0, 2).join(' ');
  }

  get pendientes(): PortalCxcDto[] { return this.cxc.filter(c => c.estado === 'Pendiente'); }

  get totalPendiente(): number { return this.pendientes.reduce((s, c) => s + +c.monto, 0); }
}
