import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { EnviarMensajeDialogComponent, EnviarMensajeData } from './enviar-mensaje-dialog/enviar-mensaje-dialog.component';
import { AvisoAusenciaDialogComponent } from './aviso-ausencia-dialog/aviso-ausencia-dialog.component';

/**
 * Comunicaciones por correo con los padres (antes era WhatsApp; la ruta y el permiso
 * siguen siendo los del módulo WHATSAPP). Pestañas: padres con correo (envío individual
 * o masivo, con adjuntos) y padres sin correo (para completarles el dato).
 */
@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  styleUrls: ['./whatsapp.component.scss']
})
export class WhatsappComponent implements OnInit {
  conCorreo: ClienteResponse[] = [];
  sinCorreo: ClienteResponse[] = [];
  filtro = '';
  loading = true;

  readonly columnasConCorreo = ['nombre', 'correo', 'telefono', 'acciones'];
  readonly columnasSinCorreo = ['nombre', 'telefono'];

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    this.clienteService.getClientes(1, 1000).subscribe({
      next: (data) => {
        const tieneCorreo = (c: ClienteResponse) => !!c.correoElectronico && c.correoElectronico.trim() !== '';
        this.conCorreo = (data ?? []).filter(tieneCorreo);
        this.sinCorreo = (data ?? []).filter(c => !tieneCorreo(c));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private filtrar(lista: ClienteResponse[]): ClienteResponse[] {
    const f = this.normalizar(this.filtro);
    if (!f) return lista;
    return lista.filter(c =>
      this.normalizar(`${c.nombreCompleto} ${c.correoElectronico ?? ''} ${c.telefono ?? ''} ${c.identidad ?? ''}`).includes(f));
  }

  private normalizar(s: string): string {
    return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  get conCorreoFiltrados(): ClienteResponse[] { return this.filtrar(this.conCorreo); }
  get sinCorreoFiltrados(): ClienteResponse[] { return this.filtrar(this.sinCorreo); }

  /** Teléfono útil para mostrar ("+504 -" y similares cuentan como vacío). */
  telefono(c: ClienteResponse): string | null {
    const t = (c.telefono ?? '').trim();
    return /\d{4}/.test(t) ? t : null;
  }

  private abrirEnvio(destinatarios: ClienteResponse[]): void {
    const data: EnviarMensajeData = { destinatarios };
    this.dialog.open(EnviarMensajeDialogComponent, { width: '600px', maxWidth: '96vw', disableClose: true, data });
  }

  abrirEnvioMasivo(): void {
    this.abrirEnvio(this.conCorreo);
  }

  enviarIndividual(cliente: ClienteResponse): void {
    this.abrirEnvio([cliente]);
  }

  abrirAvisoAusencia(): void {
    this.dialog.open(AvisoAusenciaDialogComponent, {
      width: '520px',
      disableClose: true
    });
  }
}
