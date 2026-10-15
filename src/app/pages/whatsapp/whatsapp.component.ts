import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClienteService, ContactoCorreo } from '@app/services/cliente/cliente.service';
import { EnviarMensajeDialogComponent, EnviarMensajeData } from './enviar-mensaje-dialog/enviar-mensaje-dialog.component';
import { AvisoAusenciaDialogComponent } from './aviso-ausencia-dialog/aviso-ausencia-dialog.component';

/**
 * Comunicaciones por correo con los padres (antes era WhatsApp; el permiso sigue siendo
 * el del módulo WHATSAPP). Pestañas: padres con correo (envío individual o masivo, con
 * adjuntos) y padres sin correo (para completarles el dato).
 * Por defecto solo se consideran los clientes con al menos un alumno activo o
 * prematriculado; el interruptor permite incluir a los demás (y el masivo los incluye).
 */
@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  styleUrls: ['./whatsapp.component.scss']
})
export class WhatsappComponent implements OnInit {
  private contactos: ContactoCorreo[] = [];
  incluirSinAlumnos = false;
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
    this.clienteService.getContactosCorreo().subscribe({
      next: (data) => {
        this.contactos = data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /** Clientes según el interruptor (sin aplicar la búsqueda). */
  private get visibles(): ContactoCorreo[] {
    return this.incluirSinAlumnos ? this.contactos : this.contactos.filter(c => c.alumnosActivos > 0);
  }

  get conCorreo(): ContactoCorreo[] { return this.visibles.filter(c => this.tieneCorreo(c)); }
  get sinCorreo(): ContactoCorreo[] { return this.visibles.filter(c => !this.tieneCorreo(c)); }

  /** Cuántos clientes quedan fuera por no tener alumnos activos. */
  get ocultosSinAlumnos(): number {
    return this.contactos.filter(c => c.alumnosActivos === 0).length;
  }

  private tieneCorreo(c: ContactoCorreo): boolean {
    return !!c.correoElectronico && c.correoElectronico.trim() !== '';
  }

  private filtrar(lista: ContactoCorreo[]): ContactoCorreo[] {
    const f = this.normalizar(this.filtro);
    if (!f) return lista;
    return lista.filter(c =>
      this.normalizar(`${c.nombreCompleto} ${c.correoElectronico ?? ''} ${c.telefono ?? ''} ${c.identidad ?? ''}`).includes(f));
  }

  private normalizar(s: string): string {
    return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  get conCorreoFiltrados(): ContactoCorreo[] { return this.filtrar(this.conCorreo); }
  get sinCorreoFiltrados(): ContactoCorreo[] { return this.filtrar(this.sinCorreo); }

  /** Teléfono útil para mostrar ("+504 -" y similares cuentan como vacío). */
  telefono(c: ContactoCorreo): string | null {
    const t = (c.telefono ?? '').trim();
    return /\d{4}/.test(t) ? t : null;
  }

  private abrirEnvio(destinatarios: ContactoCorreo[]): void {
    const data: EnviarMensajeData = { destinatarios };
    this.dialog.open(EnviarMensajeDialogComponent, { width: '600px', maxWidth: '96vw', disableClose: true, data });
  }

  /** Masivo: todos los padres con correo según el interruptor (la búsqueda no lo limita). */
  abrirEnvioMasivo(): void {
    this.abrirEnvio(this.conCorreo);
  }

  enviarIndividual(cliente: ContactoCorreo): void {
    this.abrirEnvio([cliente]);
  }

  abrirAvisoAusencia(): void {
    this.dialog.open(AvisoAusenciaDialogComponent, {
      width: '520px',
      disableClose: true
    });
  }
}
