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

  get puedeGuardar(): boolean {
    return this.caiValido && this.rangoDelValido && this.rangoAlValido && !this.guardando;
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
