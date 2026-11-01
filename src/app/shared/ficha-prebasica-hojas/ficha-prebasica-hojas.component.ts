import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FichaPrebasicaIndicador, ValorFichaPrebasica } from '@app/services/academico/academico.service';

export interface AreaFicha {
  area:        number;
  nombre:      string;
  indicadores: FichaPrebasicaIndicador[];
}

/** Datos del encabezado de la ficha (iguales para todos los alumnos de la sección). */
export interface EncabezadoFicha {
  anioLectivo:   number;
  gradoNombre:   string | null;
  seccion:       string | null;
  maestroNombre: string | null;
}

export const TIPOS_CENTRO = [
  { clave: 'URBANO',           nombre: 'Urbano' },
  { clave: 'RURAL',            nombre: 'Rural' },
  { clave: 'NO_GUBERNAMENTAL', nombre: 'No Gubernamental' },
  { clave: 'PROHECO',          nombre: 'PROHECO' },
  { clave: 'CEPB',             nombre: 'CEPB Universalización' },
  { clave: 'CCEPREB',          nombre: 'CCEPREB' },
];

/** Agrupa los indicadores por área, en orden. */
export function agruparPorArea(indicadores: FichaPrebasicaIndicador[]): AreaFicha[] {
  const porArea = new Map<number, AreaFicha>();
  indicadores.forEach(i => {
    if (!porArea.has(i.area)) porArea.set(i.area, { area: i.area, nombre: i.areaNombre, indicadores: [] });
    porArea.get(i.area)!.indicadores.push(i);
  });
  return Array.from(porArea.values()).sort((a, b) => a.area - b.area);
}

// Clase de <html> y <body> mientras se imprime: deja visible solo el contenedor de las hojas.
const CLASE_IMPRIMIENDO = 'ficha-pb-imprimiendo';

/**
 * Imprime (o guarda como PDF) las hojas que hay dentro de `contenedor`.
 * El contenedor se pasa un momento al <body> para que el resto de la página no salga en la impresión,
 * y se devuelve a su lugar al cerrar el diálogo de impresión.
 */
export function imprimirHojasFicha(contenedor: HTMLElement): void {
  const lugar = document.createComment('ficha-pb');
  contenedor.parentNode?.insertBefore(lugar, contenedor);
  document.body.appendChild(contenedor);
  document.documentElement.classList.add(CLASE_IMPRIMIENDO);
  document.body.classList.add(CLASE_IMPRIMIENDO);
  try {
    window.print();
  } finally {
    document.documentElement.classList.remove(CLASE_IMPRIMIENDO);
    document.body.classList.remove(CLASE_IMPRIMIENDO);
    lugar.parentNode?.replaceChild(contenedor, lugar);
  }
}

// Clase del contenedor mientras se toma la imagen de cada hoja para el PDF descargable.
const CLASE_CAPTURANDO = 'ficha-pb-capturando';

/**
 * Genera y descarga directamente (sin el diálogo de impresión) un PDF carta horizontal
 * con una página por cada hoja que hay dentro de `contenedor`.
 * El contenedor se dibuja un momento fuera de la pantalla para poder tomar la imagen de cada hoja.
 */
export async function descargarPdfHojasFicha(contenedor: HTMLElement, nombreArchivo: string): Promise<void> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import('jspdf'),
    import('html2canvas').then(m => m.default),
  ]);

  const lugar = document.createComment('ficha-pb');
  contenedor.parentNode?.insertBefore(lugar, contenedor);
  document.body.appendChild(contenedor);
  contenedor.classList.add(CLASE_CAPTURANDO);
  try {
    // Se espera a que carguen las imágenes (logo y marca de agua) antes de tomar las hojas
    await Promise.all(Array.from(contenedor.querySelectorAll('img'))
      .map(img => img.complete ? Promise.resolve() : img.decode().catch(() => undefined)));

    const hojas = Array.from(contenedor.querySelectorAll<HTMLElement>('.ficha-pb-hoja'));
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();

    for (let i = 0; i < hojas.length; i++) {
      const lienzo = await html2canvas(hojas[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      if (i > 0) doc.addPage();
      doc.addImage(lienzo.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, anchoPagina, altoPagina);
    }
    doc.save(nombreArchivo);
  } finally {
    contenedor.classList.remove(CLASE_CAPTURANDO);
    lugar.parentNode?.replaceChild(contenedor, lugar);
  }
}

/**
 * Las dos hojas de la ficha de evaluación de prebásica, igual que el formato oficial.
 * Se usa editable en Gestión académica y de solo lectura en el portal y al imprimir.
 */
@Component({
  selector: 'app-ficha-prebasica-hojas',
  templateUrl: './ficha-prebasica-hojas.component.html',
  styleUrls: ['./ficha-prebasica-hojas.component.scss'],
  // Sin encapsulación: las reglas de impresión tienen que alcanzar el <body>
  encapsulation: ViewEncapsulation.None,
})
export class FichaPrebasicaHojasComponent {
  @Input() areas: AreaFicha[] = [];
  @Input() encabezado: EncabezadoFicha | null = null;
  @Input() alumnoNombre = '';
  @Input() valoresMarcados: { [idIndicador: number]: ValorFichaPrebasica } = {};
  @Input() observaciones = '';
  @Input() nombreCentro = '';
  @Input() municipio = '';
  @Input() tipoCentro: Set<string> = new Set();
  @Input() editable = false;

  @Output() marcar = new EventEmitter<{ indicador: FichaPrebasicaIndicador; valor: ValorFichaPrebasica }>();
  @Output() marcarArea = new EventEmitter<{ area: AreaFicha; valor: ValorFichaPrebasica }>();
  @Output() observacionesChange = new EventEmitter<string>();
  @Output() nombreCentroChange = new EventEmitter<string>();
  @Output() municipioChange = new EventEmitter<string>();
  @Output() alternarTipoCentro = new EventEmitter<string>();

  readonly valores: ValorFichaPrebasica[] = ['CNL', 'CP', 'CL'];
  /** Líneas de firma del padre en la hoja impresa; la evaluación es anual. */
  readonly trimestresFirma = ['I', 'II', 'III'];
  readonly tiposCentro = TIPOS_CENTRO;

  /** "Tercer Grado de Educación Pre-Basica" → "Tercer" (así lo pide la ficha: Nivel ___ Grado). */
  get nivelCorto(): string {
    return (this.encabezado?.gradoNombre ?? '').split(' ')[0] ?? '';
  }

  valorDe(indicador: FichaPrebasicaIndicador): ValorFichaPrebasica | null {
    return this.valoresMarcados[indicador.id] ?? null;
  }
}
