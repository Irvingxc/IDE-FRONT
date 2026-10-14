import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '@app/services';
import { ComprobanteDetalle, ConceptoAnticipo, PrematriculaService } from '@app/services/prematricula/prematricula.service';
import { CatalogoService, GradoPrecioFlat } from '@app/services/catalogo/catalogo.service';
import { ContratoAlumno, ContratoCliente, ContratoService } from '@app/services/contrato/contrato.service';

/** Prematrícula: comprobante del anticipo y luego el contrato. */
export interface DocumentosPrematriculaData {
  modo:          'prematricula';
  idComprobante: number;
  identidad:     string;
  anio:          number;
}

/** Matrícula normal: solo el contrato. La mensualidad se toma del catálogo de precios del año. */
export interface DocumentosContratoData {
  modo:    'contrato';
  cliente: ContratoCliente;
  alumno:  Omit<ContratoAlumno, 'valorMensualidad'>;
  idGrado: number;
  anio:    number;
}

export type DocumentosMatriculaData = DocumentosPrematriculaData | DocumentosContratoData;

type Paso = 'comprobante' | 'contrato';

/** Id del producto "Mensualidad" en Catalogo_Grados_Productos (igual que el diálogo de contrato). */
const ID_PRODUCTO_MENSUALIDAD = 2;

/**
 * Pantalla que se muestra al terminar una matrícula:
 *  - Prematrícula (tras registrar el anticipo):
 *      1. comprobante del anticipo → Imprimir / Siguiente
 *      2. contrato del padre para ese alumno y año → Atrás / Imprimir / Finalizar
 *    Los datos salen del comprobante y de los conceptos del anticipo (mensualidad
 *    del año y descuento del alumno).
 *  - Matrícula normal: directamente el contrato → Imprimir / Finalizar, con la
 *    mensualidad del catálogo para el año de inicio de clases.
 */
@Component({
  selector: 'app-documentos-matricula-dialog',
  templateUrl: './documentos-matricula-dialog.component.html',
  styleUrls: ['./documentos-matricula-dialog.component.scss']
})
export class DocumentosMatriculaDialogComponent implements OnInit {

  /** Abre la pantalla completa; se cierra solo con "Finalizar" (o "Cerrar" si hubo error). */
  static abrir(dialog: MatDialog, data: DocumentosMatriculaData): MatDialogRef<DocumentosMatriculaDialogComponent, boolean> {
    return dialog.open(DocumentosMatriculaDialogComponent, {
      data,
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      disableClose: true,
      autoFocus: false,
      panelClass: 'dialog-documentos',
    });
  }

  @ViewChild('vista') vista?: ElementRef<HTMLIFrameElement>;

  readonly pasos: Paso[];
  indice = 0;
  cargando = true;
  error: string | null = null;

  /** Datos para la barra superior. */
  alumnoNombre = '';
  clienteNombre = '';
  noComprobante: string | null = null;
  anio: number;

  // HTML generado por la app (con datos escapados): se marca confiable una sola vez
  // para que Angular no le quite los estilos ni recargue el iframe en cada ciclo.
  private html: Partial<Record<Paso, SafeHtml>> = {};
  /** El iframe del paso actual terminó de cargar (habilita Imprimir). */
  listo = false;

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: DocumentosMatriculaData,
    private dialogRef: MatDialogRef<DocumentosMatriculaDialogComponent>,
    private prematriculaService: PrematriculaService,
    private catalogoService: CatalogoService,
    private contratoService: ContratoService,
    private notification: NotificationService
  ) {
    this.pasos = data.modo === 'prematricula' ? ['comprobante', 'contrato'] : ['contrato'];
    this.anio  = data.anio;
  }

  ngOnInit(): void {
    if (this.data.modo === 'prematricula') this.cargarPrematricula(this.data);
    else this.cargarContrato(this.data);
  }

  private cargarPrematricula(d: DocumentosPrematriculaData): void {
    forkJoin({
      comprobante: this.prematriculaService.obtenerComprobante(d.idComprobante),
      // Sin conceptos el contrato sale con la mensualidad en blanco, pero no se bloquea.
      conceptos:   this.prematriculaService.conceptos(d.identidad, d.anio)
                     .pipe(catchError(() => of([] as ConceptoAnticipo[]))),
    }).subscribe({
      next: ({ comprobante, conceptos }) => {
        const mensualidad = (conceptos ?? []).find(x => x.esMensualidad);
        this.alumnoNombre  = comprobante.alumnoNombre;
        this.clienteNombre = comprobante.clienteNombre ?? '';
        this.noComprobante = comprobante.noComprobante;
        this.anio          = comprobante.anioLectivo;
        this.html.comprobante = this.confiable(this.prematriculaService.buildComprobanteHtml(comprobante));
        this.html.contrato    = this.confiable(this.contratoService.construirHtml(
          { nombreCompleto: comprobante.clienteNombre ?? '', identidad: comprobante.clienteIdentidad ?? '' },
          {
            nombreCompleto:   comprobante.alumnoNombre,
            grado:            this.gradoConSeccion(comprobante),
            valorMensualidad: mensualidad?.precioLista ?? 0,
            descuento:        mensualidad?.descuento ?? 0,
          },
          comprobante.anioLectivo));
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = (err?.error?.errores?.mensaje ?? 'No se pudo cargar el comprobante.') +
          ' El anticipo sí quedó registrado; puede reimprimirlo desde la pestaña Prematrícula.';
      }
    });
  }

  private cargarContrato(d: DocumentosContratoData): void {
    this.alumnoNombre  = d.alumno.nombreCompleto;
    this.clienteNombre = d.cliente.nombreCompleto;
    // Sin precios cargados el contrato sale con la mensualidad en blanco, pero no se bloquea.
    this.catalogoService.getGradosConPrecios(`${d.anio}-01-01`)
      .pipe(catchError(() => of([] as GradoPrecioFlat[])))
      .subscribe(precios => {
        const mens = (precios ?? []).find(p => p.idGrado === d.idGrado && p.idProducto === ID_PRODUCTO_MENSUALIDAD);
        this.html.contrato = this.confiable(this.contratoService.construirHtml(
          d.cliente,
          { ...d.alumno, valorMensualidad: mens?.precio ?? 0 },
          d.anio));
        this.cargando = false;
      });
  }

  private gradoConSeccion(c: ComprobanteDetalle): string {
    return [c.gradoNombre, c.seccion].filter(Boolean).join(' ');
  }

  private confiable(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  get paso(): Paso { return this.pasos[this.indice]; }
  get esUltimo(): boolean { return this.indice === this.pasos.length - 1; }
  get htmlActual(): SafeHtml | null { return this.html[this.paso] ?? null; }

  alCargarVista(): void {
    // El iframe dispara load también al crearse vacío; solo cuenta si ya tiene el documento.
    if (this.htmlActual) this.listo = true;
  }

  imprimir(): void {
    const win = this.vista?.nativeElement.contentWindow;
    if (!win || !this.listo) {
      this.notification.error('El documento aún no termina de cargar. Intente de nuevo.');
      return;
    }
    win.focus();
    win.print();
  }

  siguiente(): void {
    if (this.esUltimo) return;
    this.listo = false;
    this.indice++;
  }

  atras(): void {
    if (this.indice === 0) return;
    this.listo = false;
    this.indice--;
  }

  finalizar(): void {
    this.dialogRef.close(true);
  }
}
