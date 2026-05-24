import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CxcService, CxcDetalle } from '@app/services/cxc/cxc.service';
import { AlumnoService } from '@app/services/alumno/alumno.service';
import { NuevaFacturaDialogData } from '../../facturacion/nueva-factura-dialog/nueva-factura-dialog.component';

interface CxcDetalleSeleccionable extends CxcDetalle {
  seleccionado: boolean;
}

@Component({
  selector: 'app-estado-cuenta-dialog',
  templateUrl: './estado-cuenta-dialog.component.html',
  styleUrls: ['./estado-cuenta-dialog.component.scss']
})
export class EstadoCuentaDialogComponent implements OnInit {

  detalle: CxcDetalleSeleccionable[] = [];
  cargando = true;
  columns  = ['seleccion', 'tipoCuota', 'mes', 'fechaVence', 'monto', 'estado', 'fechaPago'];

  nombreTutor = '';

  private readonly meses = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  get totalPendiente(): number {
    return this.detalle.filter(d => d.estado === 'Pendiente').reduce((s, d) => s + d.monto, 0);
  }
  get totalPagado(): number {
    return this.detalle.filter(d => d.estado === 'Pagado').reduce((s, d) => s + d.monto, 0);
  }
  get seleccionados(): CxcDetalleSeleccionable[] {
    return this.detalle.filter(d => d.seleccionado && d.estado === 'Pendiente');
  }
  get totalSeleccionado(): number {
    return this.seleccionados.reduce((s, d) => s + d.monto, 0);
  }

  constructor(
    private cxcService: CxcService,
    private alumnoService: AlumnoService,
    private router: Router,
    public  dialogRef: MatDialogRef<EstadoCuentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      identidad:   string;
      nombre:      string;
      anio:        number;
      gradoNombre: string;
    }
  ) {}

  ngOnInit(): void {
    this.cxcService.getDetalle(this.data.identidad, this.data.anio).subscribe({
      next: (d) => {
        this.detalle = (d ?? []).map(item => ({ ...item, seleccionado: false }));
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });

    // Cargar nombre del tutor para la factura
    this.alumnoService.getAlumnos(1, 1, this.data.nombre).subscribe(alumnos => {
      const match = alumnos?.find(a => a.identidad === this.data.identidad);
      if (match) this.nombreTutor = match.nombreTutor ?? '';
    });
  }

  mesLabel(mes: number): string {
    return mes === 0 ? 'Única' : (this.meses[mes] ?? `Mes ${mes}`);
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  facturar(): void {
    if (!this.seleccionados.length) return;

    const state: NuevaFacturaDialogData & { fromCxc: boolean } = {
      fromCxc:         true,
      alumnoIdentidad: this.data.identidad,
      alumnoNombre:    this.data.nombre,
      alumnoTutor:     this.nombreTutor,
      gradoNombre:     this.data.gradoNombre ?? '',
      idsCxc:          this.seleccionados.map(d => d.id),
      items: this.seleccionados.map(d => ({
        concepto:         d.tipoCuota + (d.mes > 0 ? ' ' + this.mesLabel(d.mes) : ''),
        mes:              d.mes > 0 ? this.mesLabel(d.mes).toLowerCase() : 'N/A',
        idProducto:       String(d.idProducto),
        precio:           d.monto,
        cantidad:         1,
        fechaMensualidad: d.mes > 0 ? `${d.anio}-${String(d.mes).padStart(2, '0')}-01` : null,
        idCxc:            d.id,
      })),
    };

    this.dialogRef.close();
    this.router.navigate(['/facturacion'], { state });
  }

  imprimir(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(this.buildHtml());
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
  }

  private buildHtml(): string {
    const filas = this.detalle.map(d => `
      <tr class="${d.estado === 'Pendiente' ? 'row-pend' : 'row-pag'}">
        <td>${d.tipoCuota}</td>
        <td>${this.mesLabel(d.mes)}</td>
        <td>${d.fechaVence ? new Date(d.fechaVence).toLocaleDateString('es-HN') : '—'}</td>
        <td class="monto">${this.formatLps(d.monto)}</td>
        <td><span class="chip ${d.estado === 'Pagado' ? 'chip-v' : 'chip-r'}">${d.estado}</span></td>
        <td>${d.fechaPago ? new Date(d.fechaPago).toLocaleDateString('es-HN') : '—'}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Estado de Cuenta — ${this.data.nombre}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; padding: 2cm;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { padding: 0; } @page { margin: 1.5cm; size: letter; } }
    .header { text-align: center; border-bottom: 2px solid #6B0F1A; padding-bottom: 12px; margin-bottom: 16px; }
    .header h2 { color: #6B0F1A; font-size: 14pt; margin-bottom: 2px; }
    .header p  { font-size: 10pt; color: #555; }
    .alumno-info { margin-bottom: 16px; font-size: 11pt; line-height: 1.8; }
    .alumno-info strong { color: #6B0F1A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #6B0F1A; color: #fff; padding: 7px 8px; font-size: 10pt; text-align: left; }
    td { padding: 6px 8px; font-size: 10pt; border-bottom: 1px solid #eee; }
    .row-pend { background: #fff8f8; }
    .row-pag  { background: #f8fff8; }
    .monto    { font-family: 'Courier New', monospace; text-align: right; }
    .chip { padding: 2px 8px; border-radius: 8px; font-size: 9pt; font-weight: 600; }
    .chip-v { background: #e8f5e9; color: #2e7d32; }
    .chip-r { background: #ffebee; color: #c62828; }
    .totales { display: flex; justify-content: flex-end; gap: 32px; padding-top: 12px;
               border-top: 2px solid #6B0F1A; margin-top: 4px; }
    .total-bloque { text-align: right; }
    .total-label { font-size: 9pt; color: #666; }
    .total-valor { font-size: 14pt; font-weight: bold; font-family: 'Courier New', monospace; }
    .total-valor.pend   { color: #c62828; }
    .total-valor.pagado { color: #2e7d32; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Estado de Cuenta — Año Lectivo ${this.data.anio}</h2>
    <p>Institute for the Development of Excellence (IDE) — Danlí, El Paraíso, Honduras</p>
  </div>
  <div class="alumno-info">
    <strong>Alumno:</strong> ${this.data.nombre}<br>
    <strong>Identidad:</strong> ${this.data.identidad}<br>
    <strong>Año lectivo:</strong> ${this.data.anio}
  </div>
  <table>
    <thead>
      <tr><th>Cuota</th><th>Período</th><th>Vence</th><th>Monto</th><th>Estado</th><th>Fecha Pago</th></tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="totales">
    <div class="total-bloque">
      <div class="total-label">Total Pagado</div>
      <div class="total-valor pagado">${this.formatLps(this.totalPagado)}</div>
    </div>
    <div class="total-bloque">
      <div class="total-label">Total Pendiente</div>
      <div class="total-valor pend">${this.formatLps(this.totalPendiente)}</div>
    </div>
  </div>
</body>
</html>`;
  }

  get hoyStr(): string {
    return new Date().toISOString().split('T')[0];
  }
}
