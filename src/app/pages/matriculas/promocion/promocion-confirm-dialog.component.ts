import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PromocionConfirmData {
  total:       number;
  egresan:     number;
  anioOrigen:  number;
  anioDestino: number;
}

@Component({
  selector: 'app-promocion-confirm-dialog',
  template: `
    <h2 mat-dialog-title>Confirmar promoción</h2>
    <mat-dialog-content>
      <p>
        Se promoverán <strong>{{ data.total }}</strong> alumno(s) del año lectivo
        <strong>{{ data.anioOrigen }}</strong> al <strong>{{ data.anioDestino }}</strong>.
      </p>
      <p *ngIf="data.egresan > 0">
        De ellos, <strong>{{ data.egresan }}</strong> están en el último grado y pasarán a
        estado <strong>Egresado</strong>.
      </p>
      <p class="warning-text">
        Se actualizará el grado, sección, nivel de inglés y mensualidad vigentes de cada
        alumno, y se registrará su matrícula del año {{ data.anioDestino }}. La acción queda
        en la Bitácora de Seguridad.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        <mat-icon>trending_up</mat-icon> Sí, promover
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content p { margin: 8px 0; }
    .warning-text { color: #888; font-size: 13px; }
    mat-dialog-actions { gap: 8px; padding-bottom: 16px !important; }
  `]
})
export class PromocionConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PromocionConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromocionConfirmData
  ) {}
}
