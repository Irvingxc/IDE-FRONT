import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AsistenciaService, EnvioAvisosAusenciaDto } from '@app/services/asistencia/asistencia.service';

@Component({
  selector: 'app-aviso-ausencia-dialog',
  templateUrl: './aviso-ausencia-dialog.component.html',
  styleUrls: ['./aviso-ausencia-dialog.component.scss']
})
export class AvisoAusenciaDialogComponent {
  fecha: Date = new Date();
  hoy: Date = new Date();
  enviando = false;
  resultado: EnvioAvisosAusenciaDto | null = null;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AvisoAusenciaDialogComponent>,
    private asistenciaService: AsistenciaService
  ) {}

  enviar(): void {
    if (!this.fecha || this.enviando) return;
    this.enviando = true;
    this.error = null;
    this.resultado = null;

    this.asistenciaService.enviarAvisosAusencia(this.fecha).subscribe({
      next: (res) => {
        this.enviando = false;
        this.resultado = res;
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.errores?.mensaje ?? 'No se pudieron enviar los avisos de ausencia.';
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.resultado);
  }
}
