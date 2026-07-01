import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ComprasService, CompraDetalleDto } from '@app/services/compras/compras.service';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-detalle-compra-dialog',
  templateUrl: './detalle-compra-dialog.component.html',
  styleUrls: ['./detalle-compra-dialog.component.scss'],
})
export class DetalleCompraDialogComponent implements OnInit {

  compra: CompraDetalleDto | null = null;
  cargando = true;
  columns  = ['descripcion', 'categoria', 'cantidad', 'valorUnitario', 'total'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private comprasService: ComprasService
  ) {}

  ngOnInit(): void {
    this.comprasService.obtenerDetalle(this.data.id).subscribe({
      next: (c) => { this.compra = c; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  formatLps(v: number): string { return this.comprasService.formatLps(v); }
  formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }
}
