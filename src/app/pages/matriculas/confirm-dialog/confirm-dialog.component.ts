import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  nombre: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>Inactivar alumno</h2>
    <mat-dialog-content>
      <p>¿Está seguro que desea inactivar a <strong>{{ data.nombre }}</strong>?</p>
      <p class="warning-text">Esta acción cambiará el estado del alumno a inactivo.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        <mat-icon>block</mat-icon> Sí, inactivar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content p { margin: 8px 0; }
    .warning-text { color: #888; font-size: 13px; }
    mat-dialog-actions { gap: 8px; padding-bottom: 16px !important; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
