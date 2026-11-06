import { Component, Inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import {
  PruebaAspiranteDetalle, PruebasAspirantesService, formatoCodigo
} from '@app/services/pruebas-aspirantes/pruebas-aspirantes.service';

/** Hoja de respuestas calificada (solo administracion: trae la clave). */
@Component({
  selector: 'app-detalle-prueba-dialog',
  templateUrl: './detalle-prueba-dialog.component.html',
  styleUrls: ['./detalle-prueba-dialog.component.scss'],
  providers: [DatePipe]
})
export class DetallePruebaDialogComponent implements OnInit {

  detalle: PruebaAspiranteDetalle | null = null;
  cargando = true;

  readonly formatoCodigo = formatoCodigo;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { id: number },
    private svc: PruebasAspirantesService,
    private notification: NotificationService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.svc.detalle(this.data.id).subscribe({
      next: d => { this.detalle = d; this.cargando = false; },
      error: err => {
        this.cargando = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo cargar la prueba.');
      }
    });
  }

  estadoRespuesta(r: { correcta: string; respuesta: string | null }): 'ok' | 'mal' | 'vacia' {
    if (!r.respuesta) return 'vacia';
    return r.respuesta === r.correcta ? 'ok' : 'mal';
  }

  minutosUsados(): number | null {
    const p = this.detalle?.prueba;
    if (!p?.fechaInicio || !p.fechaFin) return null;
    return Math.max(0, Math.round((new Date(p.fechaFin).getTime() - new Date(p.fechaInicio).getTime()) / 60000));
  }

  private fecha(valor: string | null, formato = 'dd/MM/yyyy h:mm a'): string {
    return valor ? (this.datePipe.transform(valor, formato) ?? '') : '';
  }

  /** Abre una ventana con la hoja calificada lista para imprimir o guardar en PDF. */
  imprimir(): void {
    const d = this.detalle;
    if (!d) return;
    const p = d.prueba;
    const esc = (s: string | number | null | undefined) =>
      String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

    const filas = d.respuestas.map(r => {
      const est = this.estadoRespuesta(r);
      const letras = r.opciones.split('').map(l => {
        const cls = [
          l === r.respuesta ? 'marcada' : '',
          l === r.correcta ? 'correcta' : ''
        ].join(' ');
        return `<span class="l ${cls}">${l}</span>`;
      }).join('');
      return `<div class="fila ${est}"><span class="n">${r.numero}</span>${letras}<span class="m">${est === 'ok' ? '✓' : est === 'mal' ? '✗' : '–'}</span></div>`;
    }).join('');

    const edad = p.edadAnios != null ? `${p.edadAnios} años${p.edadMeses != null ? ` ${p.edadMeses} meses` : ''}` : '';
    const usados = this.minutosUsados();

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(p.tipoNombre)} - ${esc(p.nombre)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 24px; color: #222; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 16px; margin: 12px 0; }
  .datos b { color: #555; font-weight: normal; }
  .res { border: 1px solid #333; padding: 8px 12px; display: flex; gap: 24px; margin-bottom: 12px; }
  .res div { font-size: 13px; } .res strong { font-size: 16px; }
  .hoja { columns: 3; column-gap: 18px; }
  .fila { display: flex; align-items: center; gap: 3px; padding: 2px 0; break-inside: avoid; }
  .n { width: 22px; text-align: right; font-weight: bold; margin-right: 4px; }
  .l { width: 18px; height: 16px; line-height: 16px; text-align: center; border: 1px solid #bbb; border-radius: 3px; }
  .l.correcta { border: 2px solid #2e7d32; }
  .l.marcada { background: #333; color: #fff; }
  .mal .l.marcada { background: #c62828; }
  .ok .l.marcada { background: #2e7d32; }
  .m { margin-left: 4px; width: 12px; }
  .ley { margin-top: 12px; color: #555; }
  @media print { body { margin: 10mm; } }
</style></head><body>
<h1>${esc(p.tipoNombre)} — Hoja de respuestas calificada</h1>
<div class="datos">
  <div><b>Nombre:</b> ${esc(p.nombre)}</div>
  <div><b>Sexo:</b> ${p.sexo === 'M' ? 'Masculino' : 'Femenino'}</div>
  <div><b>Edad:</b> ${esc(edad)}</div>
  <div><b>Puesto:</b> ${esc(p.puesto)}</div>
  <div><b>Lugar:</b> ${esc(p.lugar)}</div>
  <div><b>Ciudad:</b> ${esc(p.ciudad)}</div>
  <div><b>Fecha:</b> ${esc(this.fecha(p.fechaInicio ?? p.fechaCreacion))}</div>
  <div><b>Tiempo usado:</b> ${usados != null ? usados + ' de ' + p.minutosLimite + ' min' : ''}</div>
  <div><b>Código:</b> ${esc(formatoCodigo(p.codigo))}</div>
</div>
<div class="res">
  <div>Punteo<br><strong>${esc(p.aciertos ?? '')}</strong> / ${p.numPreguntas}</div>
  <div>Errores<br><strong>${esc(p.errores ?? '')}</strong></div>
  <div>Sin responder<br><strong>${esc(p.omitidas ?? '')}</strong></div>
  <div>Percentil<br><strong>${esc(p.percentil)}</strong></div>
  <div>Diagnóstico<br><strong>${esc(p.diagnostico)}</strong></div>
</div>
<div class="hoja">${filas}</div>
<p class="ley">Letra rellena: respuesta del aspirante (verde correcta, roja incorrecta). Borde verde: respuesta correcta.
Baremo: Tabla 4, nivel profesional (${p.sexo === 'M' ? 'hombres' : 'mujeres'}).
${p.salidasPestana > 0 ? 'Salió de la pestaña de la prueba ' + p.salidasPestana + ' vez/veces.' : ''}</p>
<script>window.onload = function () { window.print(); };<\/script>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      this.notification.error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}
