import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { EnviarMensajeDialogComponent } from './enviar-mensaje-dialog/enviar-mensaje-dialog.component';

@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  styleUrls: ['./whatsapp.component.scss']
})
export class WhatsappComponent implements OnInit {
  clientes: ClienteResponse[] = [];
  loading = true;
  columnas = ['nombre', 'telefono', 'acciones'];

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
        this.clientes = data.filter(c => c.telefono && c.telefono.trim() !== '');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  abrirEnvioMasivo(): void {
    this.dialog.open(EnviarMensajeDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { clientes: this.clientes }
    });
  }

  enviarIndividual(cliente: ClienteResponse): void {
    const telefono = cliente.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${telefono}`, '_blank');
  }
}
