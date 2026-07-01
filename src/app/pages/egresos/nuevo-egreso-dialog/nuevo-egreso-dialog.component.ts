import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EgresosService, CATEGORIAS_EGRESO } from '@app/services/egresos/egresos.service';
import { toLocalDateStr } from '@app/utils/date.utils';

@Component({
  selector: 'app-nuevo-egreso-dialog',
  templateUrl: './nuevo-egreso-dialog.component.html',
  styleUrls: ['./nuevo-egreso-dialog.component.scss'],
})
export class NuevoEgresoDialogComponent {

  fecha      = new Date();
  categoria  = '';
  concepto   = '';
  monto      = 0;
  descripcion = '';
  guardando  = false;

  readonly categorias = CATEGORIAS_EGRESO;

  constructor(
    public  dialogRef: MatDialogRef<NuevoEgresoDialogComponent>,
    private egresosService: EgresosService,
    private snack: MatSnackBar
  ) {}

  get puedeGuardar(): boolean {
    return !!this.categoria && !!this.concepto.trim() && this.monto > 0 && !this.guardando;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;
    this.egresosService.guardar({
      fecha:       toLocalDateStr(this.fecha),
      categoria:   this.categoria,
      concepto:    this.concepto.trim(),
      monto:       this.monto,
      descripcion: this.descripcion.trim() || undefined,
    }).subscribe({
      next: () => { this.guardando = false; this.dialogRef.close(true); },
      error: (err) => {
        this.guardando = false;
        this.snack.open(err?.error?.message ?? 'Error al guardar', '', { duration: 4000 });
      }
    });
  }
}
