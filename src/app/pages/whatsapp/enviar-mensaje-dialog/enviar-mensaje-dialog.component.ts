import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  EmailService, EXTENSIONES_BLOQUEADAS, MAX_ADJUNTOS, MAX_BYTES_ADJUNTOS
} from '@app/services/email/email.service';

/** Lo mínimo que el diálogo necesita de cada padre. */
export interface DestinatarioVista {
  nombreCompleto:    string;
  correoElectronico: string | null;
}

export interface EnviarMensajeData {
  /** Padres con correo a quienes se envía. Uno solo = envío individual. */
  destinatarios: DestinatarioVista[];
}

/** Envío de correo a uno o a todos los padres con correo, con archivos adjuntos. */
@Component({
  selector: 'app-enviar-mensaje-dialog',
  templateUrl: './enviar-mensaje-dialog.component.html',
  styleUrls: ['./enviar-mensaje-dialog.component.scss']
})
export class EnviarMensajeDialogComponent {
  readonly maxAdjuntos = MAX_ADJUNTOS;

  asunto = '';
  mensaje = '';
  adjuntos: File[] = [];
  errorAdjuntos: string | null = null;

  enviando = false;
  enviado = false;
  errorEnvio: string | null = null;
  resultado: { enviados: number; fallidos: number; erroresEmails: string[] } | null = null;

  constructor(
    public dialogRef: MatDialogRef<EnviarMensajeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EnviarMensajeData,
    private emailService: EmailService
  ) {}

  get individual(): boolean { return this.data.destinatarios.length === 1; }
  get destinatario(): DestinatarioVista { return this.data.destinatarios[0]; }

  get pesoTotal(): number {
    return this.adjuntos.reduce((s, a) => s + a.size, 0);
  }

  get puedeEnviar(): boolean {
    return !!this.asunto.trim() && !!this.mensaje.trim()
      && this.data.destinatarios.length > 0 && !this.enviando && !this.enviado;
  }

  agregarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    input.value = '';   // permite volver a elegir el mismo archivo
    this.errorAdjuntos = null;

    for (const archivo of nuevos) {
      const ext = archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase();
      if (EXTENSIONES_BLOQUEADAS.includes(ext)) {
        this.errorAdjuntos = `No se permite adjuntar "${archivo.name}" (archivo ejecutable).`;
        continue;
      }
      if (archivo.size === 0) {
        this.errorAdjuntos = `El archivo "${archivo.name}" está vacío.`;
        continue;
      }
      if (this.adjuntos.some(a => a.name === archivo.name && a.size === archivo.size)) continue;
      if (this.adjuntos.length >= MAX_ADJUNTOS) {
        this.errorAdjuntos = `Máximo ${MAX_ADJUNTOS} archivos.`;
        break;
      }
      if (this.pesoTotal + archivo.size > MAX_BYTES_ADJUNTOS) {
        this.errorAdjuntos = `"${archivo.name}" no cabe: los adjuntos no pueden pasar de 15 MB en total.`;
        continue;
      }
      this.adjuntos.push(archivo);
    }
  }

  quitarArchivo(i: number): void {
    this.adjuntos.splice(i, 1);
    this.errorAdjuntos = null;
  }

  tamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  icono(nombre: string): string {
    const ext = nombre.slice(nombre.lastIndexOf('.') + 1).toLowerCase();
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'description';
    return 'attach_file';
  }

  enviar(): void {
    if (!this.puedeEnviar) return;
    this.enviando = true;
    this.errorEnvio = null;

    this.emailService.enviarMasivo({
      destinatarios: this.data.destinatarios
        .filter(c => !!c.correoElectronico)
        .map(c => ({ email: c.correoElectronico!, nombre: c.nombreCompleto })),
      asunto:  this.asunto.trim(),
      mensaje: this.mensaje,
      adjuntos: this.adjuntos,
    }).subscribe({
      next: (res) => {
        this.resultado = res;
        this.enviando = false;
        this.enviado = true;
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio = err?.error?.errores?.mensaje
          ?? (err?.status === 413 ? 'Los adjuntos son demasiado grandes.' : 'No se pudo enviar el correo. Intente de nuevo.');
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.enviado);
  }
}
