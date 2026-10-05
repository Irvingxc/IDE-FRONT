import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { NotificationService } from '@app/services';
import { FacturacionService } from '@app/services/facturacion/facturacion.service';
import { ComprobanteResumen, Prematriculado, PrematriculaService } from '@app/services/prematricula/prematricula.service';
import { AnticipoDialogComponent } from '../anticipo-dialog/anticipo-dialog.component';
import { PrematricularAlumnoDialogComponent, PrematricularAlumnoResultado } from './prematricular-alumno-dialog.component';

// Pestaña Prematrícula: alumnos prematriculados para el año siguiente (nuevos desde
// Nueva matrícula y actuales desde aquí) y sus comprobantes de anticipo.
@Component({
  selector: 'app-prematricula',
  templateUrl: './prematricula.component.html',
  styleUrls: ['./prematricula.component.scss']
})
export class PrematriculaComponent implements OnInit {

  anio = new Date().getFullYear() + 1;
  readonly anios = [this.anio - 1, this.anio, this.anio + 1];

  cargando = false;
  filtro = '';
  prematriculados: Prematriculado[] = [];
  comprobantes: ComprobanteResumen[] = [];
  procesando: number | string | null = null;   // id de comprobante o identidad en proceso

  constructor(
    private prematriculaService: PrematriculaService,
    private facturacionService: FacturacionService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({
      prematriculados: this.prematriculaService.listar(this.anio),
      comprobantes:    this.prematriculaService.listarComprobantes(this.anio),
    }).subscribe({
      next: ({ prematriculados, comprobantes }) => {
        this.prematriculados = prematriculados ?? [];
        this.comprobantes = comprobantes ?? [];
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private coincide(...textos: (string | null | undefined)[]): boolean {
    const t = this.filtro.trim().toLowerCase();
    return !t || textos.some(x => (x ?? '').toLowerCase().includes(t));
  }

  get prematriculadosVisibles(): Prematriculado[] {
    return this.prematriculados.filter(p => this.coincide(p.nombreCompleto, p.identidad, p.clienteNombre));
  }

  get comprobantesVisibles(): ComprobanteResumen[] {
    return this.comprobantes.filter(c => this.coincide(c.alumnoNombre, c.noComprobante, c.idAlumno, c.noFactura));
  }

  get totalVigente(): number {
    return this.comprobantes.filter(c => c.estado === 'Vigente').reduce((s, c) => s + c.total, 0);
  }

  prematricularActual(): void {
    const ref = this.dialog.open(PrematricularAlumnoDialogComponent, { width: '640px', data: { anio: this.anio } });
    ref.afterClosed().subscribe((r?: PrematricularAlumnoResultado) => {
      if (!r) return;
      this.cargar();
      this.registrarAnticipo(r.identidad, r.alumnoNombre, r.gradoNombre);
    });
  }

  registrarAnticipo(identidad: string, alumnoNombre: string, gradoNombre?: string | null): void {
    const ref = this.dialog.open(AnticipoDialogComponent, {
      width: '640px',
      data: { identidad, anio: this.anio, alumnoNombre, gradoNombre },
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  cancelarPrematricula(p: Prematriculado): void {
    const motivo = prompt(`Cancelar la prematrícula ${this.anio} de ${p.nombreCompleto}.` +
      (p.tipo === 'Nuevo' ? ' El alumno quedará inactivo.' : '') + '\n\nMotivo:');
    if (motivo === null) return;
    if (!motivo.trim()) { this.notification.error('Indique el motivo'); return; }

    this.procesando = p.identidad;
    this.prematriculaService.cancelar(p.identidad, this.anio, motivo.trim()).subscribe({
      next: () => { this.procesando = null; this.notification.success('Prematrícula cancelada'); this.cargar(); },
      error: (err) => { this.procesando = null; this.notification.error(err.error?.errores?.mensaje ?? 'Error al cancelar'); }
    });
  }

  imprimir(c: ComprobanteResumen): void {
    this.prematriculaService.imprimirComprobante(c.id);
  }

  facturar(c: ComprobanteResumen): void {
    if (!confirm(`¿Emitir la factura (con CAI) del comprobante ${c.noComprobante} por ${this.fmt(c.total)}?\n\n` +
                 'No se cobra de nuevo: la factura respalda el anticipo ya recibido.')) return;

    this.procesando = c.id;
    this.prematriculaService.facturarComprobante(c.id).subscribe({
      next: (r) => {
        this.procesando = null;
        this.notification.success(`Factura ${r.noFactura} emitida`);
        this.facturacionService.getDetalle(r.idPago).subscribe(detalle =>
          this.facturacionService.imprimirHtml(this.facturacionService.buildFacturaHtml(detalle)));
        this.cargar();
      },
      error: (err) => { this.procesando = null; this.notification.error(err.error?.errores?.mensaje ?? 'Error al facturar'); }
    });
  }

  anular(c: ComprobanteResumen): void {
    const motivo = prompt(`Anular el comprobante ${c.noComprobante} (${this.fmt(c.total)}).\n\nMotivo:`);
    if (motivo === null) return;
    if (!motivo.trim()) { this.notification.error('Indique el motivo'); return; }

    this.procesando = c.id;
    this.prematriculaService.anularComprobante(c.id, motivo.trim()).subscribe({
      next: () => { this.procesando = null; this.notification.success('Comprobante anulado'); this.cargar(); },
      error: (err) => { this.procesando = null; this.notification.error(err.error?.errores?.mensaje ?? 'Error al anular'); }
    });
  }

  fmt(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
