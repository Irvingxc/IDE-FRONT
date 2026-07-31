import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { parseLocalDate } from '@app/utils/date.utils';

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
  descuento:        number;
}

export interface PagoDetalle {
  id:              number;
  fecha:           string;
  alumno:          string;
  nombreAlumno:    string;
  nombreCliente:   string | null;
  rtnCliente:      string | null;
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
  descuento:        number;
}

export interface CrearFacturaRequest {
  alumno:          string;
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

  anularFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
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

  private numToLetras(n: number): string {
    const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
                      'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS',
                      'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const DECENAS  = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
                      'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const CENTENAS = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
                      'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const grupo = (num: number): string => {
      if (num === 0) return '';
      if (num === 100) return 'CIEN';
      let t = '';
      const c = Math.floor(num / 100);
      const r = num % 100;
      if (c > 0) t += CENTENAS[c] + (r > 0 ? ' ' : '');
      if (r < 20) {
        t += UNIDADES[r];
      } else {
        const d = Math.floor(r / 10);
        const u = r % 10;
        t += DECENAS[d] + (u > 0 ? ' Y ' + UNIDADES[u] : '');
      }
      return t;
    };

    const entero = Math.floor(n);
    const cents  = Math.round((n - entero) * 100);
    let res = '';

    const mill = Math.floor(entero / 1_000_000);
    if (mill > 0) res += (mill === 1 ? 'UN MILLÓN' : grupo(mill) + ' MILLONES') + ' ';
    const miles = Math.floor((entero % 1_000_000) / 1_000);
    if (miles > 0) res += (miles === 1 ? 'MIL' : grupo(miles) + ' MIL') + ' ';
    const resto = entero % 1_000;
    if (resto > 0) res += grupo(resto);

    res = res.trim() || 'CERO';
    res += entero === 1 ? ' LEMPIRA' : ' LEMPIRAS';
    res += cents > 0
      ? ` CON ${grupo(cents)} ${cents === 1 ? 'CENTAVO' : 'CENTAVOS'}`
      : ' EXACTOS';
    return res;
  }

  private escHtml(s: string | null | undefined): string {
    return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Imprime HTML sin usar window.open(): varias facturas encoladas seguidas
   * disparan el bloqueador de pop-ups del navegador ("ventana bloqueada" / error)
   * a partir de la 2da o 3ra ventana. Un iframe oculto no cuenta como pop-up,
   * así que se puede encolar cuantas impresiones se quiera sin ese límite.
   */
  imprimirHtml(html: string): void {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) { iframe.remove(); return; }

      const limpiar = () => iframe.remove();
      win.addEventListener('afterprint', limpiar, { once: true });
      setTimeout(limpiar, 60000); // red de seguridad si el navegador no dispara afterprint

      win.focus();
      win.print();
    };

    iframe.srcdoc = html;
  }

  buildFacturaHtml(p: PagoDetalle): string {
    const logoUrl     = window.location.origin + '/assets/logo.png';
    const totalExento = p.total - p.impuestoGravado;
    const fechaStr    = p.fecha    ? parseLocalDate(p.fecha).toLocaleDateString('es-HN')    : '—';
    const fechaLimStr = p.fechaLim ? parseLocalDate(p.fechaLim).toLocaleDateString('es-HN') : '—';
    const cliente     = p.nombreCliente || p.nombreAlumno;

    let totalDescuentos = 0;
    let totalBruto      = 0;

    const filas = p.items.map((i, idx) => {
      const anioMens = i.fechaMensualidad ? parseLocalDate(i.fechaMensualidad).getFullYear() : null;
      const sufijo   = i.mes && i.mes !== 'N/A' ? ` ${this.escHtml(i.mes)}${anioMens ? ' ' + anioMens : ''}` : '';
      const concepto = i.nombreProducto
        ? (sufijo ? `${this.escHtml(i.nombreProducto)}${sufijo}` : this.escHtml(i.nombreProducto))
        : (sufijo ? `Mensualidad${sufijo}` : `Producto ${this.escHtml(i.idProducto)}`);
      const desc       = i.descuento ?? 0;
      const precioOrig = desc > 0 && desc < 100 ? Math.round((i.precio / (1 - desc / 100)) * 100) / 100 : i.precio;
      const montoDesc  = Math.round((precioOrig - i.precio) * i.cantidad * 100) / 100;
      totalBruto      += precioOrig * i.cantidad;
      totalDescuentos += montoDesc;
      return `
      <tr class="${idx % 2 === 1 ? 'fila-alt' : ''}">
        <td>${concepto}</td>
        <td class="monto">${this.formatLps(precioOrig)}</td>
        <td class="center">${i.cantidad}</td>
        <td class="monto">${montoDesc > 0 ? this.formatLps(montoDesc) : '0.00'}</td>
        <td class="monto">${this.formatLps(i.precio * i.cantidad)}</td>
      </tr>`;
    }).join('');

    const esAnulada = p.anulada === '1';

    const valorLetras = this.numToLetras(p.total);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${this.escHtml(p.noFactura)}${esAnulada ? ' [ANULADA]' : ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; }
    body {
      font-family: Arial, sans-serif; font-size: 9pt; color: #1a1a1a;
      padding: 1cm; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    @page { margin: 1cm; size: letter landscape; }
    .sello-anulada {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 90pt; font-weight: 900; color: rgba(180,0,0,0.18);
      border: 12px solid rgba(180,0,0,0.18); border-radius: 12px;
      padding: 10px 30px; pointer-events: none; white-space: nowrap;
      z-index: 9999; letter-spacing: 8px;
    }
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
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 6px; table-layout: fixed; }
    table.items thead tr { background: #6B0F1A; color: #fff; }
    table.items th { padding: 6px 7px; font-size: 8.5pt; text-align: left; font-weight: 600; }
    table.items th.monto, table.items td.monto { text-align: right; font-family: 'Courier New', monospace; }
    table.items th.center, table.items td.center { text-align: center; }
    table.items td { padding: 5px 7px; font-size: 8.5pt; border-bottom: 1px solid #eee; }
    table.items tr.fila-alt td { background: #fdf0f0; }
    table.items tbody tr:last-child td { border-bottom: 2px solid #6B0F1A; }
.valor-letras {
      font-size: 8.5pt; padding: 5px 8px; margin-bottom: 8px;
      border: 1px solid #ddd; border-radius: 3px; background: #fafafa;
    }
    .valor-letras strong { color: #6B0F1A; margin-right: 4px; }
    .totales-section { display: grid; grid-template-columns: 1fr 260px; gap: 0 24px; margin-top: 4px; }
    .firmas { font-size: 7.5pt; color: #555; padding-top: 20px; line-height: 2.4; }
    .firmas span { display: block; border-bottom: 1px solid #999; margin-bottom: 2px; }
    .totales-tabla { font-size: 8.5pt; }
    .t-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #ddd; gap: 8px; }
    .t-row label { color: #444; white-space: nowrap; }
    .t-val { font-family: 'Courier New', monospace; white-space: nowrap; }
    .t-row.grand { font-size: 12pt; font-weight: bold; color: #c62828; border-top: 2px solid #6B0F1A; border-bottom: 2px solid #6B0F1A; padding: 5px 0; margin-top: 3px; }
    .t-row.subtotal-row { font-weight: 700; border-bottom: 1px solid #6B0F1A; padding-bottom: 4px; margin-bottom: 2px; }
    .footer {
      text-align: center; margin-top: 16px; padding-top: 8px;
      border-top: 2px solid #6B0F1A; font-size: 8.5pt; color: #6B0F1A;
    }
    .footer .exijala { font-size: 9pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
    .footer .lema    { font-size: 7.5pt; letter-spacing: 2px; color: #888; margin-top: 2px; text-transform: uppercase; }
  </style>
</head>
<body>
  ${esAnulada ? '<div class="sello-anulada">ANULADA</div>' : ''}
  <div class="header">
    <img src="${logoUrl}" alt="IDE Logo">
    <div class="header-text">
      <div class="empresa-nombre">INVERSIONES CALIX GUTIÉRREZ S. DE R.L.</div>
      <div class="empresa-sub">INSTITUTE FOR THE DEVELOPMENT OF EXCELLENCE</div>
      <div class="empresa-contacto">Villa Madrid, Danlí, a 100 metros de UNAH-TEC.<br>ide@developmentofexcellence.com &nbsp;|&nbsp; RTN: 08019021301711</div>
    </div>
  </div>
  <div class="meta-box">
    <div class="meta-row"><label>No:</label> <span class="no-factura-val">${this.escHtml(p.noFactura)}</span></div>
    <div class="meta-row"><label>CAI:</label> <span>${this.escHtml(p.cai)}</span></div>
    <div class="meta-row"><label>Rango del:</label> <span>${this.escHtml(p.rangoDel)} &nbsp;Al&nbsp; ${this.escHtml(p.rangoAl)}</span></div>
    <div class="meta-row"><label>Fecha Límite:</label> <span>${fechaLimStr}</span></div>
    <div class="meta-row"><label>Fecha Emisión:</label> <span>${fechaStr}</span></div>
    <div></div>
  </div>
  <div class="receptor">
    <div><label>Estudiante:</label>${this.escHtml(p.nombreAlumno)}</div>
    <div><label>Grado:</label>${this.escHtml(p.grade) || '—'}</div>
    <div><label>Cliente:</label>${this.escHtml(cliente)}</div>
    ${p.rtnCliente ? `<div><label>RTN Cliente:</label>${this.escHtml(p.rtnCliente)}</div>` : '<div></div>'}
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:40%">Descripción</th>
        <th class="monto">Precio Unitario</th>
        <th class="center">Cantidad</th>
        <th class="monto">Descuentos y Rebajas</th>
        <th class="monto">Total</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="valor-letras">
    <strong>VALOR EN LETRAS:</strong>${valorLetras}
  </div>
  <div class="totales-section">
    <div class="firmas">
      <span>Nº Correlativo de orden de compra exenta &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <span>Nº Correlativo de constancia de registro exonerado &nbsp;</span>
      <span>Nº Correlativo del registro de la SAG &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
    </div>
    <div class="totales-tabla">
      <div class="t-row subtotal-row"><label>Subtotal</label><span class="t-val">${this.formatLps(totalBruto)}</span></div>
      <div class="t-row"><label>Descuentos y Rebajas</label><span class="t-val">${totalDescuentos > 0 ? this.formatLps(totalDescuentos) : 'L. 0.00'}</span></div>
      <div class="t-row"><label>Importe Exonerado</label><span class="t-val">L. 0.00</span></div>
      <div class="t-row"><label>Importe Exento</label><span class="t-val">${this.formatLps(totalExento)}</span></div>
      <div class="t-row"><label>Importe Gravado 15%</label><span class="t-val">${this.formatLps(p.impuestoGravado)}</span></div>
      <div class="t-row"><label>Importe Gravado 18%</label><span class="t-val">L. 0.00</span></div>
      <div class="t-row"><label>I.S.V. 15%</label><span class="t-val">L. 0.00</span></div>
      <div class="t-row"><label>I.S.V. 18%</label><span class="t-val">L. 0.00</span></div>
      <div class="t-row grand"><label>TOTAL A PAGAR</label><span class="t-val">${this.formatLps(p.total)}</span></div>
    </div>
  </div>
  <div class="footer">
    <div class="exijala">La factura es beneficio de todos &mdash; &ldquo;¡EXÍJALA!&rdquo;</div>
    <div class="lema">Ethics, Science &amp; Technology</div>
  </div>
</body>
</html>`;
  }
}
