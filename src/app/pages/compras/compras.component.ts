import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ComprasService, CompraResumenDto } from '@app/services/compras/compras.service';
import { NuevaCompraDialogComponent } from './nueva-compra-dialog/nueva-compra-dialog.component';
import { DetalleCompraDialogComponent } from './detalle-compra-dialog/detalle-compra-dialog.component';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.scss']
})
export class ComprasComponent implements OnInit {

  columns    = ['fecha', 'noFactura', 'proveedor', 'items', 'total', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<CompraResumenDto>();
  cargando   = false;

  anio   = new Date().getFullYear();
  mes    = new Date().getMonth() + 1;
  estado = '';

  readonly meses = [
    { val: 0, label: 'Todos' },
    { val: 1, label: 'Enero' },    { val: 2,  label: 'Febrero' },
    { val: 3, label: 'Marzo' },    { val: 4,  label: 'Abril' },
    { val: 5, label: 'Mayo' },     { val: 6,  label: 'Junio' },
    { val: 7, label: 'Julio' },    { val: 8,  label: 'Agosto' },
    { val: 9, label: 'Septiembre'},{ val: 10, label: 'Octubre' },
    { val: 11,label: 'Noviembre'}, { val: 12, label: 'Diciembre' },
  ];

  constructor(
    private comprasService: ComprasService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.comprasService.listar(this.anio, this.mes, this.estado || undefined).subscribe({
      next: (data) => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  get totalMes(): number {
    return this.dataSource.data
      .filter(c => c.estado === 'Activa')
      .reduce((s, c) => s + c.total, 0);
  }

  nuevaCompra(): void {
    const ref = this.dialog.open(NuevaCompraDialogComponent, {
      width: '900px', maxWidth: '98vw', disableClose: true
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  verDetalle(compra: CompraResumenDto): void {
    this.dialog.open(DetalleCompraDialogComponent, {
      width: '760px', maxWidth: '98vw',
      data: { id: compra.id }
    });
  }

  anular(compra: CompraResumenDto): void {
    if (!confirm(`¿Anular la compra ${compra.noFactura ?? '#' + compra.id} de ${compra.proveedor}? Los ítems de inventario se marcarán como "Dado de baja".`)) return;
    this.comprasService.anular(compra.id).subscribe({
      next: () => { this.snack.open('Compra anulada', '', { duration: 3000 }); this.cargar(); },
      error: (err: any) => this.snack.open(err?.error?.message ?? 'Error al anular', '', { duration: 4000 })
    });
  }

  formatLps(v: number): string { return this.comprasService.formatLps(v); }
  formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }
}
