import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import { ConceptoAnticipo, LineaAnticipo, MESES, PrematriculaService } from '@app/services/prematricula/prematricula.service';

export interface AnticipoDialogData {
  identidad:     string;
  anio:          number;
  alumnoNombre:  string;
  gradoNombre?:  string | null;
}

// Registra el anticipo de una prematrícula: se eligen los conceptos (matrícula, libros,
// mensualidad de uno o más meses), se emite el comprobante PM y se imprime.
@Component({
  selector: 'app-anticipo-dialog',
  templateUrl: './anticipo-dialog.component.html',
  styleUrls: ['./anticipo-dialog.component.scss']
})
export class AnticipoDialogComponent implements OnInit {

  readonly meses = MESES;

  cargando = true;
  guardando = false;
  conceptos: ConceptoAnticipo[] = [];
  seleccionados = new Set<number>();   // conceptos de cuota única
  mesesSeleccionados: number[] = [];   // meses de mensualidad (1..12)
  observacion = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AnticipoDialogData,
    private dialogRef: MatDialogRef<AnticipoDialogComponent>,
    private prematriculaService: PrematriculaService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.prematriculaService.conceptos(this.data.identidad, this.data.anio).subscribe({
      next: (c) => { this.conceptos = c ?? []; this.cargando = false; },
      error: (err) => {
        this.cargando = false;
        this.notification.error(err.error?.errores?.mensaje ?? 'No se pudieron cargar los conceptos');
      }
    });
  }

  get cuotasUnicas(): ConceptoAnticipo[] { return this.conceptos.filter(c => !c.esMensualidad); }
  get mensualidad(): ConceptoAnticipo | undefined { return this.conceptos.find(c => c.esMensualidad); }

  alternar(c: ConceptoAnticipo, marcado: boolean): void {
    if (marcado) this.seleccionados.add(c.idProducto);
    else this.seleccionados.delete(c.idProducto);
  }

  get lineas(): LineaAnticipo[] {
    const lineas: LineaAnticipo[] = [...this.seleccionados].map(id => ({ idProducto: id, mes: 0 }));
    const mens = this.mensualidad;
    if (mens) [...this.mesesSeleccionados].sort((a, b) => a - b).forEach(m => lineas.push({ idProducto: mens.idProducto, mes: m }));
    return lineas;
  }

  get total(): number {
    return this.lineas.reduce((s, l) => s + (this.conceptos.find(c => c.idProducto === l.idProducto)?.monto ?? 0), 0);
  }

  registrar(): void {
    if (this.lineas.length === 0 || this.guardando) return;
    this.guardando = true;
    this.prematriculaService.crearComprobante(this.data.identidad, this.data.anio, this.lineas, this.observacion.trim() || null)
      .subscribe({
        next: (r) => {
          this.notification.success(`Comprobante ${r.noComprobante} registrado`);
          this.prematriculaService.imprimirComprobante(r.idComprobante);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.guardando = false;
          this.notification.error(err.error?.errores?.mensaje ?? 'Error al registrar el anticipo');
        }
      });
  }

  fmt(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
