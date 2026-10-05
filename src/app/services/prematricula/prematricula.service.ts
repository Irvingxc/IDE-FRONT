import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { FacturacionService } from '@app/services/facturacion/facturacion.service';
import { parseLocalDate } from '@app/utils/date.utils';

export interface Prematriculado {
  identidad:         string;
  codigo:            number;
  nombreCompleto:    string;
  tipo:              'Nuevo' | 'Actual';
  anioLectivo:       number;
  idGrado:           number | null;
  gradoNombre:       string | null;
  seccion:           string | null;
  gradoActual:       string | null;
  seccionActual:     string | null;
  fechaInicioClases: string | null;
  clienteNombre:     string | null;
  comprobantes:      number;
  totalAnticipado:   number;
}

export interface PrematricularAlumnoDto {
  identidad:         string;
  idGrado:           number;
  seccion:           string;
  fechaInicioClases: string;   // yyyy-MM-dd
}

export interface ConceptoAnticipo {
  idProducto:    number;
  nombre:        string;
  esMensualidad: boolean;
  precioLista:   number;
  descuento:     number;
  monto:         number;
}

export interface LineaAnticipo {
  idProducto: number;
  mes:        number;   // 0 = cuota única; 1..12 = mensualidad
}

export interface ComprobanteResumen {
  id:              number;
  noComprobante:   string;
  fecha:           string;
  idAlumno:        string;
  alumnoNombre:    string;
  gradoNombre:     string | null;
  seccion:         string | null;
  anioLectivo:     number;
  conceptos:       string | null;
  total:           number;
  estado:          'Vigente' | 'Facturado' | 'Anulado';
  idPago:          number | null;
  noFactura:       string | null;
  motivoAnulacion: string | null;
}

export interface ComprobanteLinea {
  id:          number;
  idProducto:  number;
  concepto:    string;
  mes:         number;
  precioLista: number;
  descuento:   number;
  monto:       number;
}

export interface ComprobanteDetalle {
  id:                number;
  noComprobante:     string;
  fecha:             string;
  idAlumno:          string;
  alumnoNombre:      string;
  alumnoCodigo:      number | null;
  anioLectivo:       number;
  gradoNombre:       string | null;
  seccion:           string | null;
  fechaInicioClases: string | null;
  clienteNombre:     string | null;
  clienteIdentidad:  string | null;
  total:             number;
  estado:            'Vigente' | 'Facturado' | 'Anulado';
  noFactura:         string | null;
  observacion:       string | null;
  motivoAnulacion:   string | null;
  creadoPorNombre:   string | null;
  lineas:            ComprobanteLinea[];
}

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
                      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

@Injectable({ providedIn: 'root' })
export class PrematriculaService {

  private readonly base = `${environment.url}api/Prematricula`;

  constructor(private http: HttpClient, private facturacion: FacturacionService) {}

  listar(anio: number): Observable<Prematriculado[]> {
    return this.http.get<Prematriculado[]>(this.base, { params: new HttpParams().set('anio', anio) });
  }

  prematricularAlumno(dto: PrematricularAlumnoDto): Observable<void> {
    return this.http.post<void>(this.base, dto);
  }

  cancelar(identidad: string, anio: number, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.base}/cancelar`, { identidad, anio, motivo });
  }

  conceptos(identidad: string, anio: number): Observable<ConceptoAnticipo[]> {
    const params = new HttpParams().set('identidad', identidad).set('anio', anio);
    return this.http.get<ConceptoAnticipo[]>(`${this.base}/conceptos`, { params });
  }

  listarComprobantes(anio: number): Observable<ComprobanteResumen[]> {
    return this.http.get<ComprobanteResumen[]>(`${this.base}/comprobantes`, { params: new HttpParams().set('anio', anio) });
  }

  obtenerComprobante(id: number): Observable<ComprobanteDetalle> {
    return this.http.get<ComprobanteDetalle>(`${this.base}/comprobantes/${id}`);
  }

  crearComprobante(identidad: string, anio: number, lineas: LineaAnticipo[], observacion: string | null):
      Observable<{ idComprobante: number; noComprobante: string }> {
    return this.http.post<{ idComprobante: number; noComprobante: string }>(
      `${this.base}/comprobantes`, { identidad, anio, lineas, observacion });
  }

  anularComprobante(id: number, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.base}/comprobantes/${id}/anular`, { motivo });
  }

  facturarComprobante(id: number): Observable<{ noFactura: string; idPago: number }> {
    return this.http.post<{ noFactura: string; idPago: number }>(`${this.base}/comprobantes/${id}/facturar`, {});
  }

  /** Descarga el comprobante y lo manda a imprimir. */
  imprimirComprobante(id: number): void {
    this.obtenerComprobante(id).subscribe(c => this.facturacion.imprimirHtml(this.buildComprobanteHtml(c)));
  }

  /**
   * Comprobante de anticipo de prematrícula. Mismo estilo que la factura, pero sin
   * nada fiscal (sin CAI, rango, fecha límite ni RTN): no sustituye a la factura.
   */
  buildComprobanteHtml(c: ComprobanteDetalle): string {
    const esc = (s: string | null | undefined) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
                                                          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const lps = (v: number) => this.facturacion.formatLps(v);
    const fecha = (s: string | null) => s ? parseLocalDate(s).toLocaleDateString('es-HN') : '—';
    const logoUrl = window.location.origin + '/assets/logo.png';
    const grado = [c.gradoNombre, c.seccion].filter(Boolean).join(' — ');

    let totalBruto = 0;
    let totalDescuentos = 0;
    const filas = c.lineas.map((l, idx) => {
      const desc = Math.round((l.precioLista - l.monto) * 100) / 100;
      totalBruto += l.precioLista;
      totalDescuentos += desc;
      return `
      <tr class="${idx % 2 === 1 ? 'fila-alt' : ''}">
        <td>${esc(l.concepto)}</td>
        <td class="monto">${lps(l.precioLista)}</td>
        <td class="monto">${desc > 0 ? lps(desc) + (l.descuento > 0 ? ` (${l.descuento}%)` : '') : '0.00'}</td>
        <td class="monto">${lps(l.monto)}</td>
      </tr>`;
    }).join('');

    const sello = c.estado === 'Anulado' ? '<div class="sello">ANULADO</div>' : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante ${esc(c.noComprobante)}${c.estado === 'Anulado' ? ' [ANULADO]' : ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a;
      padding: 1cm; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    @page { margin: 1cm; size: letter portrait; }
    .sello {
      position: fixed; top: 45%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 80pt; font-weight: 900; color: rgba(180,0,0,0.18);
      border: 12px solid rgba(180,0,0,0.18); border-radius: 12px;
      padding: 10px 30px; white-space: nowrap; letter-spacing: 8px;
    }
    .header {
      display: flex; align-items: center; gap: 14px;
      padding-bottom: 10px; border-bottom: 3px solid #6B0F1A; margin-bottom: 12px;
    }
    .header img { height: 72px; width: auto; }
    .header-text { flex: 1; }
    .empresa-nombre { font-size: 13pt; font-weight: bold; color: #6B0F1A; letter-spacing: .4px; }
    .empresa-sub    { font-size: 9.5pt; color: #444; margin: 2px 0 4px; }
    .empresa-contacto { font-size: 8pt; color: #666; line-height: 1.5; }
    .titulo { text-align: center; margin-bottom: 10px; }
    .titulo h1 { font-size: 14pt; color: #6B0F1A; letter-spacing: 1px; }
    .titulo .no-fiscal { font-size: 8.5pt; color: #c62828; font-weight: bold; margin-top: 3px; }
    .meta-box {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
      background: #fdf5f5; border: 1px solid #e8c7c7; border-radius: 4px;
      padding: 8px 12px; margin-bottom: 10px; font-size: 9pt;
    }
    .meta-box label, .receptor label { font-weight: bold; color: #6B0F1A; margin-right: 4px; }
    .no-val { font-size: 12pt; font-weight: bold; color: #6B0F1A; }
    .receptor {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px;
      border-left: 4px solid #6B0F1A; padding: 6px 10px;
      background: #fafafa; margin-bottom: 12px; font-size: 9pt;
    }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    table.items thead tr { background: #6B0F1A; color: #fff; }
    table.items th { padding: 6px 8px; font-size: 9pt; text-align: left; }
    table.items th.monto, table.items td.monto { text-align: right; font-family: 'Courier New', monospace; }
    table.items td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    table.items tr.fila-alt td { background: #fdf0f0; }
    .valor-letras {
      font-size: 9pt; padding: 6px 8px; margin-bottom: 10px;
      border: 1px solid #ddd; border-radius: 3px; background: #fafafa;
    }
    .valor-letras strong { color: #6B0F1A; margin-right: 4px; }
    .totales { margin-left: auto; width: 280px; font-size: 9pt; }
    .t-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ddd; }
    .t-val { font-family: 'Courier New', monospace; }
    .t-row.grand { font-size: 12pt; font-weight: bold; color: #6B0F1A; border-top: 2px solid #6B0F1A; border-bottom: 2px solid #6B0F1A; padding: 5px 0; }
    .nota { margin-top: 14px; font-size: 8.5pt; color: #444; line-height: 1.5; }
    .nota strong { color: #6B0F1A; }
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; font-size: 8.5pt; text-align: center; }
    .firmas div { border-top: 1px solid #999; padding-top: 4px; }
    .footer {
      text-align: center; margin-top: 24px; padding-top: 8px;
      border-top: 2px solid #6B0F1A; font-size: 7.5pt; letter-spacing: 2px; color: #888; text-transform: uppercase;
    }
  </style>
</head>
<body>
  ${sello}
  <div class="header">
    <img src="${logoUrl}" alt="IDE Logo">
    <div class="header-text">
      <div class="empresa-nombre">INSTITUTE FOR THE DEVELOPMENT OF EXCELLENCE</div>
      <div class="empresa-sub">Villa Madrid, Danlí, a 100 metros de UNAH-TEC.</div>
      <div class="empresa-contacto">ide@developmentofexcellence.com</div>
    </div>
  </div>
  <div class="titulo">
    <h1>COMPROBANTE DE PREMATRÍCULA ${c.anioLectivo}</h1>
    <div class="no-fiscal">Documento no fiscal — no válido como factura</div>
  </div>
  <div class="meta-box">
    <div><label>No.:</label> <span class="no-val">${esc(c.noComprobante)}</span></div>
    <div><label>Fecha:</label> ${fecha(c.fecha)}</div>
    <div><label>Año lectivo:</label> ${c.anioLectivo}</div>
    <div><label>Inicio de clases:</label> ${fecha(c.fechaInicioClases)}</div>
  </div>
  <div class="receptor">
    <div><label>Estudiante:</label>${esc(c.alumnoNombre)}</div>
    <div><label>Grado ${c.anioLectivo}:</label>${esc(grado) || '—'}</div>
    <div><label>Padre / Encargado:</label>${esc(c.clienteNombre) || '—'}</div>
    <div><label>Identidad:</label>${esc(c.clienteIdentidad) || '—'}</div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th>Concepto anticipado</th>
        <th class="monto">Precio</th>
        <th class="monto">Descuento</th>
        <th class="monto">Total</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="valor-letras"><strong>VALOR RECIBIDO:</strong>${this.facturacion.numToLetras(c.total)}</div>
  <div class="totales">
    <div class="t-row"><span>Subtotal</span><span class="t-val">${lps(totalBruto)}</span></div>
    <div class="t-row"><span>Descuentos</span><span class="t-val">${lps(totalDescuentos)}</span></div>
    <div class="t-row grand"><span>TOTAL RECIBIDO</span><span class="t-val">${lps(c.total)}</span></div>
  </div>
  <div class="nota">
    ${c.observacion ? `<div><strong>Observación:</strong> ${esc(c.observacion)}</div>` : ''}
    <div>Este comprobante respalda el anticipo recibido para la prematrícula del año lectivo ${c.anioLectivo}.
         La factura correspondiente se emitirá posteriormente por los mismos conceptos, sin cobro adicional.</div>
    ${c.estado === 'Facturado' && c.noFactura ? `<div><strong>Facturado con la factura No.</strong> ${esc(c.noFactura)}</div>` : ''}
    ${c.estado === 'Anulado' ? `<div><strong>ANULADO:</strong> ${esc(c.motivoAnulacion)}</div>` : ''}
  </div>
  <div class="firmas">
    <div>Recibido por${c.creadoPorNombre ? ': ' + esc(c.creadoPorNombre) : ''}</div>
    <div>Firma del padre / encargado</div>
  </div>
  <div class="footer">Ethics, Science &amp; Technology</div>
</body>
</html>`;
  }
}
