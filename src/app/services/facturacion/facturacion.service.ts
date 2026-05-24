import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface Sar {
  idSar:        number;
  cai:          string;
  rangoDel:     string;
  rangoAl:      string;
  fechaLim:     string;
  impuestoSar:  number;
  secuenciaSar: string;
}

export interface PagoResumen {
  id:              number;
  fecha:           string;
  alumno:          string;
  nombreAlumno:    string;
  noFactura:       string;
  total:           number;
  impuestoGravado: number;
  anulada:         string;
  grade:           string;
}

export interface ItemDetalle {
  id:               number;
  precio:           number;
  mes:              string;
  idProducto:       string;
  nombreProducto:   string | null;
  fechaMensualidad: string | null;
  cantidad:         number;
  total:            number;
}

export interface PagoDetalle {
  id:              number;
  fecha:           string;
  alumno:          string;
  nombreAlumno:    string;
  nombreCliente:   string | null;
  noFactura:       string;
  total:           number;
  impuestoGravado: number;
  anulada:         string;
  grade:           string;
  cai:             string;
  rangoDel:        string;
  rangoAl:         string;
  fechaLim:        string;
  impuestoSar:     number;
  items:           ItemDetalle[];
}

export interface ItemFacturaRequest {
  precio:           number;
  mes:              string;
  idProducto:       string;
  fechaMensualidad: string | null;
  cantidad:         number;
}

export interface CrearFacturaRequest {
  alumno:          string;
  grade:           string;
  idSar:           number;
  fechaEmision:    string;
  total:           number;
  impuestoGravado: number;
  items:           ItemFacturaRequest[];
  idsCxc?:         number[];
}

export interface FacturaCreada {
  noFactura: string;
  idPago:    number;
}

export interface GradoPrecio {
  idGrado:        number;
  gradoNombre:    string;
  nivel:          string;
  orden:          number;
  idProducto:     number;
  productoNombre: string;
  precio:         number;
}

@Injectable({ providedIn: 'root' })
export class FacturacionService {
  private base    = `${environment.url}api/Facturacion`;
  private catBase = `${environment.url}api/Catalogo`;

  constructor(private http: HttpClient) {}

  getSar(): Observable<Sar> {
    return this.http.get<Sar>(`${this.base}/sar`);
  }

  getListarPagos(anio: number, mes = 0, alumno = '', anulada = ''): Observable<PagoResumen[]> {
    let params = new HttpParams().set('anio', anio).set('mes', mes);
    if (alumno)  params = params.set('alumno',  alumno);
    if (anulada) params = params.set('anulada', anulada);
    return this.http.get<PagoResumen[]>(this.base, { params });
  }

  getDetalle(id: number): Observable<PagoDetalle> {
    return this.http.get<PagoDetalle>(`${this.base}/${id}`);
  }

  crearFactura(dto: CrearFacturaRequest): Observable<FacturaCreada> {
    return this.http.post<FacturaCreada>(this.base, dto);
  }

  getGradoPrecios(idGrado: number): Observable<GradoPrecio[]> {
    return this.http.get<GradoPrecio[]>(`${this.catBase}/grados-precios`).pipe(
      map(lista => lista.filter(p => p.idGrado === idGrado))
    );
  }

  getProductosFacturados(identidad: string, anio: number): Observable<{ idProducto: string; mes: string }[]> {
    return this.http.get<{ idProducto: string; mes: string }[]>(
      `${this.base}/${encodeURIComponent(identidad)}/facturados`,
      { params: { anio } }
    );
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  buildFacturaHtml(p: PagoDetalle): string {
    const logoUrl     = window.location.origin + '/assets/logo.png';
    const totalExento = p.total - p.impuestoGravado;
    const fechaStr    = p.fecha    ? new Date(p.fecha).toLocaleDateString('es-HN')    : '—';
    const fechaLimStr = p.fechaLim ? new Date(p.fechaLim).toLocaleDateString('es-HN') : '—';
    const cliente     = p.nombreCliente || p.nombreAlumno;

    const filas = p.items.map((i, idx) => {
      const concepto = i.nombreProducto
        ? (i.mes && i.mes !== 'N/A' ? `${i.nombreProducto} ${i.mes}` : i.nombreProducto)
        : (i.mes && i.mes !== 'N/A' ? `Mensualidad ${i.mes}` : `Producto ${i.idProducto}`);
      return `
      <tr class="${idx % 2 === 1 ? 'fila-alt' : ''}">
        <td>${concepto}</td>
        <td class="monto">${this.formatLps(i.precio)}</td>
        <td class="center">${i.cantidad}</td>
        <td class="monto">0.00</td>
        <td class="monto">${this.formatLps(i.precio * i.cantidad)}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${p.noFactura}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; }
    body {
      font-family: Arial, sans-serif; font-size: 9pt; color: #1a1a1a;
      padding: 1cm; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    @page { margin: 1cm; size: letter landscape; }
    .header {
      display: flex; align-items: center; gap: 14px;
      padding-bottom: 10px; border-bottom: 3px solid #6B0F1A; margin-bottom: 10px;
    }
    .header img { height: 72px; width: auto; flex-shrink: 0; }
    .header-text { flex: 1; min-width: 0; }
    .header-text .empresa-nombre { font-size: 13pt; font-weight: bold; color: #6B0F1A; letter-spacing: .4px; }
    .header-text .empresa-sub    { font-size: 9.5pt; color: #444; margin: 2px 0 4px; }
    .header-text .empresa-contacto { font-size: 8pt; color: #666; line-height: 1.5; }
    .meta-box {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
      background: #fdf5f5; border: 1px solid #e8c7c7; border-radius: 4px;
      padding: 8px 12px; margin-bottom: 10px; font-size: 8.5pt;
      overflow-wrap: break-word; word-break: break-all;
    }
    .meta-box .meta-row { display: flex; gap: 5px; align-items: baseline; flex-wrap: wrap; }
    .meta-box label { font-weight: bold; color: #6B0F1A; white-space: nowrap; word-break: normal; }
    .no-factura-val { font-size: 12pt; font-weight: bold; color: #6B0F1A; }
    .receptor {
      display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px;
      border-left: 4px solid #6B0F1A; padding: 6px 10px;
      background: #fafafa; margin-bottom: 10px; font-size: 8.5pt;
    }
    .receptor label { font-weight: bold; color: #6B0F1A; margin-right: 4px; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
    table.items thead tr { background: #6B0F1A; color: #fff; }
    table.items th { padding: 6px 7px; font-size: 8.5pt; text-align: left; font-weight: 600; }
    table.items th.monto, table.items td.monto { text-align: right; font-family: 'Courier New', monospace; }
    table.items th.center, table.items td.center { text-align: center; }
    table.items td { padding: 5px 7px; font-size: 8.5pt; border-bottom: 1px solid #eee; }
    table.items tr.fila-alt td { background: #fdf0f0; }
    table.items tbody tr:last-child td { border-bottom: 2px solid #6B0F1A; }
    .totales-section { display: grid; grid-template-columns: 1fr 240px; gap: 0 24px; margin-top: 4px; }
    .firmas { font-size: 7.5pt; color: #555; padding-top: 20px; line-height: 2.4; }
    .firmas span { display: block; border-bottom: 1px solid #999; margin-bottom: 2px; }
    .totales-tabla { font-size: 8.5pt; }
    .t-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #ddd; gap: 8px; }
    .t-row label { color: #444; white-space: nowrap; }
    .t-val { font-family: 'Courier New', monospace; white-space: nowrap; }
    .t-row.grand { font-size: 12pt; font-weight: bold; color: #6B0F1A; border-top: 2px solid #6B0F1A; border-bottom: 2px solid #6B0F1A; padding: 5px 0; margin-top: 3px; }
    .footer { text-align: center; margin-top: 22px; padding-top: 8px; border-top: 2px solid #6B0F1A; font-size: 8.5pt; font-weight: bold; letter-spacing: 2px; color: #6B0F1A; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="IDE Logo">
    <div class="header-text">
      <div class="empresa-nombre">INVERSIONES CALIX GUTIÉRREZ S. DE R.L.</div>
      <div class="empresa-sub">INSTITUTE FOR THE DEVELOPMENT OF EXCELLENCE</div>
      <div class="empresa-contacto">Villa Madrid, Danlí, a 100 metros de UNAH-TEC.<br>ide@developmentofexcellence.com &nbsp;|&nbsp; RTN: 08019021301711</div>
    </div>
  </div>
  <div class="meta-box">
    <div class="meta-row"><label>No:</label> <span class="no-factura-val">${p.noFactura}</span></div>
    <div class="meta-row"><label>CAI:</label> <span>${p.cai ?? '—'}</span></div>
    <div class="meta-row"><label>Rango del:</label> <span>${p.rangoDel ?? '—'} &nbsp;Al&nbsp; ${p.rangoAl ?? '—'}</span></div>
    <div class="meta-row"><label>Fecha Límite:</label> <span>${fechaLimStr}</span></div>
    <div class="meta-row"><label>Fecha Emisión:</label> <span>${fechaStr}</span></div>
    <div></div>
  </div>
  <div class="receptor">
    <div><label>Estudiante:</label>${p.nombreAlumno}</div>
    <div><label>Grado:</label>${p.grade ?? '—'}</div>
    <div><label>Cliente:</label>${cliente}</div>
    <div></div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:40%">Detalle</th>
        <th class="monto">Precio</th>
        <th class="center">Cantidad</th>
        <th class="monto">ISV</th>
        <th class="monto">Total</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="totales-section">
    <div class="firmas">
      <span>No O/C exenta &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <span>No registro de exonerado &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <span>No registro de la SAG &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    </div>
    <div class="totales-tabla">
      <div class="t-row"><label>Sub Total</label><span class="t-val">${this.formatLps(p.total)}</span></div>
      <div class="t-row"><label>Descuentos</label><span class="t-val">0</span></div>
      <div class="t-row"><label>Importe Exento</label><span class="t-val">${this.formatLps(totalExento)}</span></div>
      <div class="t-row"><label>Importe Gravado 15%</label><span class="t-val">${this.formatLps(p.impuestoGravado)}</span></div>
      <div class="t-row"><label>Importe Gravado 18%</label><span class="t-val">0</span></div>
      <div class="t-row"><label>ISV 15%</label><span class="t-val">0.00</span></div>
      <div class="t-row"><label>ISV 18%</label><span class="t-val">0</span></div>
      <div class="t-row grand"><label>Total</label><span class="t-val">${this.formatLps(p.total)}</span></div>
    </div>
  </div>
  <div class="footer">Ethics, Science &amp; Technology</div>
</body>
</html>`;
  }
}
