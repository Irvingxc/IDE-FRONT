import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse } from '@app/services/cliente/cliente.service';

export interface EnviarMensajeData {
  clientes: ClienteResponse[];
}

@Component({
  selector: 'app-enviar-mensaje-dialog',
  templateUrl: './enviar-mensaje-dialog.component.html',
  styleUrls: ['./enviar-mensaje-dialog.component.scss']
})
export class EnviarMensajeDialogComponent {
  mensaje = '';
  enviando = false;
  enviado = false;
  progreso = 0;

  constructor(
    public dialogRef: MatDialogRef<EnviarMensajeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EnviarMensajeData
  ) {}

  get totalDestinatarios(): number {
    return this.data.clientes.length;
  }

  async enviar(): Promise<void> {
    if (!this.mensaje.trim()) return;
    this.enviando = true;
    this.progreso = 0;

    const total = this.data.clientes.length;
    for (let i = 0; i < total; i++) {
      const cliente = this.data.clientes[i];
      const telefono = cliente.telefono.replace(/\D/g, '');
      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(this.mensaje)}`;
      window.open(url, '_blank');
      this.progreso = Math.round(((i + 1) / total) * 100);
      await this.delay(400);
    }

    this.enviando = false;
    this.enviado = true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
