import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SarService } from '@app/services/sar/sar.service';
import { toLocalDateStr } from '@app/utils/date.utils';

@Component({
  selector: 'app-nuevo-sar-dialog',
  templateUrl: './nuevo-sar-dialog.component.html',
  styleUrls: ['./nuevo-sar-dialog.component.scss']
})
export class NuevoSarDialogComponent {

  cai         = '';
  rangoDel    = '';
  rangoAl     = '';
  fechaLim    = new Date();
  impuestoPct = 15;

  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<NuevoSarDialogComponent>,
    private svc: SarService,
    private snack: MatSnackBar
  ) {}

  onCaiInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const formatted = this.svc.formatCai(el.value);
    el.value  = formatted;
    this.cai  = formatted;
  }

  onRangoDelInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const formatted = this.svc.formatRango(el.value);
    el.value      = formatted;
    this.rangoDel = formatted;
  }

  onRangoAlInput(e: Event): void {
    const el = e.target as HTMLInputElement;
    const formatted = this.svc.formatRango(el.value);
    el.value     = formatted;
    this.rangoAl = formatted;
  }

  get caiValido():      boolean { return this.svc.caiCompleto(this.cai); }
  get rangoDelValido(): boolean { return this.svc.rangoCompleto(this.rangoDel); }
  get rangoAlValido():  boolean { return this.svc.rangoCompleto(this.rangoAl); }

  /**
   * Problema del rango (mismas reglas que sp_SAR_Guardar); null si está bien.
   * El cruce con otros CAI lo valida el servidor.
   */
  get errorRango(): string | null {
    if (!this.rangoDelValido || !this.rangoAlValido) return null;
    if (this.rangoDel.slice(0, 11) !== this.rangoAl.slice(0, 11))
      return 'Desde y Hasta deben tener el mismo prefijo (los primeros 10 dígitos).';
    const del = Number(this.rangoDel.slice(-8));
    const al  = Number(this.rangoAl.slice(-8));
    if (del < 1)  return 'El rango Desde debe empezar en 1 o más.';
    if (del > al) return 'El rango Desde debe ser menor o igual que Hasta.';
    return null;
  }

  /** Cantidad de facturas que autoriza el rango. */
  get totalFacturas(): number | null {
    if (!this.rangoDelValido || !this.rangoAlValido || this.errorRango) return null;
    return Number(this.rangoAl.slice(-8)) - Number(this.rangoDel.slice(-8)) + 1;
  }

  get fechaVencida(): boolean {
    if (!this.fechaLim) return true;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lim = new Date(this.fechaLim);
    lim.setHours(0, 0, 0, 0);
    return lim < hoy;
  }

  get puedeGuardar(): boolean {
    return this.caiValido && this.rangoDelValido && this.rangoAlValido
      && !this.errorRango && !this.fechaVencida && !this.guardando;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;
    this.svc.guardar({
      cai:         this.cai,
      rangoDel:    this.rangoDel,
      rangoAl:     this.rangoAl,
      fechaLim:    toLocalDateStr(this.fechaLim),
      impuestoSar: this.impuestoPct / 100,
    }).subscribe({
      next:  () => { this.snack.open('CAI registrado correctamente', '', { duration: 3000 }); this.dialogRef.close(true); },
      error: (err) => { this.snack.open(err?.error?.errores?.mensaje ?? err?.error?.errores ?? 'Error al guardar', '', { duration: 4000 }); this.guardando = false; }
    });
  }

  cancelar(): void { this.dialogRef.close(false); }
}
