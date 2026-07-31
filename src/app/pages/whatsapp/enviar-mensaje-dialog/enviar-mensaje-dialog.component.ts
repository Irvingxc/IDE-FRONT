import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse } from '@app/services/cliente/cliente.service';
import { EmailService } from '@app/services/email/email.service';

export interface EnviarMensajeData {
  clientesTelefono: ClienteResponse[];
  clientesCorreo:   ClienteResponse[];
}

export type CanalEnvio = 'whatsapp' | 'email';

@Component({
  selector: 'app-enviar-mensaje-dialog',
  templateUrl: './enviar-mensaje-dialog.component.html',
  styleUrls: ['./enviar-mensaje-dialog.component.scss']
})
export class EnviarMensajeDialogComponent {
  canal: CanalEnvio = 'whatsapp';
  asunto = '';
  mensaje = '';
  enviando = false;
  enviado = false;
  progreso = 0;
  resultadoCorreo: { enviados: number; fallidos: number } | null = null;

  constructor(
    public dialogRef: MatDialogRef<EnviarMensajeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EnviarMensajeData,
    private emailService: EmailService
  ) {}

  get destinatarios(): ClienteResponse[] {
    return this.canal === 'whatsapp' ? this.data.clientesTelefono : this.data.clientesCorreo;
  }

  get totalDestinatarios(): number {
    return this.destinatarios.length;
  }

  get puedeEnviar(): boolean {
    if (!this.mensaje.trim() || this.totalDestinatarios === 0) return false;
    if (this.canal === 'email' && !this.asunto.trim()) return false;
    return true;
  }

  cambiarCanal(canal: CanalEnvio): void {
    if (this.enviando || this.enviado) return;
    this.canal = canal;
  }

  async enviar(): Promise<void> {
    if (!this.puedeEnviar) return;
    this.canal === 'whatsapp' ? await this.enviarPorWhatsapp() : await this.enviarPorCorreo();
  }

  private async enviarPorWhatsapp(): Promise<void> {
    this.enviando = true;
    this.progreso = 0;

    const total = this.data.clientesTelefono.length;
    for (let i = 0; i < total; i++) {
      const cliente = this.data.clientesTelefono[i];
      const telefono = cliente.telefono.replace(/\D/g, '');
      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(this.mensaje)}`;
      window.open(url, '_blank');
      this.progreso = Math.round(((i + 1) / total) * 100);
      await this.delay(400);
    }

    this.enviando = false;
    this.enviado = true;
  }

  private async enviarPorCorreo(): Promise<void> {
    this.enviando = true;
    this.progreso = 0;

    const destinatarios = this.data.clientesCorreo.map(c => ({
      email:  c.correoElectronico,
      nombre: c.nombreCompleto
    }));

    this.emailService.enviarMasivo({
      destinatarios,
      asunto:  this.asunto,
      mensaje: this.mensaje
    }).subscribe({
      next: (res) => {
        this.resultadoCorreo = { enviados: res.enviados, fallidos: res.fallidos };
        this.enviando = false;
        this.enviado = true;
      },
      error: () => {
        this.enviando = false;
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
