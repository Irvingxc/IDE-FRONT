import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { InventarioService, InventarioDto, CATEGORIAS_INVENTARIO, ESTADOS_INVENTARIO } from '@app/services/inventario/inventario.service';
import { NuevoItemDialogComponent } from './nuevo-item-dialog/nuevo-item-dialog.component';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {

  columns    = ['nombre', 'categoria', 'cantidad', 'valorUnitario', 'valorTotal', 'fechaAdquisicion', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<InventarioDto>();
  cargando   = false;

  filtroCategoria = '';
  filtroEstado    = '';

  readonly categorias = CATEGORIAS_INVENTARIO;
  readonly estados    = ESTADOS_INVENTARIO;

  constructor(
    private invService: InventarioService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.invService.listar(
      this.filtroCategoria || undefined,
      this.filtroEstado    || undefined
    ).subscribe({
      next: (data) => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  get totalActivos(): number {
    return this.dataSource.data.filter(i => i.estado === 'Activo').reduce((s, i) => s + i.valorTotal, 0);
  }

  get totalItems(): number {
    return this.dataSource.data.filter(i => i.estado === 'Activo').reduce((s, i) => s + i.cantidad, 0);
  }

  nuevoItem(): void {
    const ref = this.dialog.open(NuevoItemDialogComponent, { width: '500px', disableClose: true });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  cambiarEstado(item: InventarioDto, estado: string): void {
    if (item.estado === estado) return;
    this.invService.actualizarEstado(item.id, estado).subscribe({
      next: () => { this.snack.open(`Estado actualizado a "${estado}"`, '', { duration: 3000 }); this.cargar(); },
      error: (err) => this.snack.open(err?.error?.message ?? 'Error al actualizar', '', { duration: 4000 })
    });
  }

  formatLps(v: number): string { return this.invService.formatLps(v); }

  formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }

  estadoClass(estado: string): string {
    return estado === 'Activo' ? 'chip-verde' : estado === 'En reparación' ? 'chip-amarillo' : 'chip-rojo';
  }
}
