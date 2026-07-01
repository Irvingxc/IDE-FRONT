import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComprasService, CrearCompraItemDto } from '@app/services/compras/compras.service';
import { ProveedoresService, ProveedorDto } from '@app/services/proveedores/proveedores.service';
import { InventarioService, InventarioDto } from '@app/services/inventario/inventario.service';
import { toLocalDateStr } from '@app/utils/date.utils';

interface LineaDetalle {
  idInventario?:  number;
  descripcion:    string;
  categoria:      string;
  cantidad:       number;
  valorUnitario:  number;
  cantExistente?: number;
  valorExistente?: number;
}

@Component({
  selector: 'app-nueva-compra-dialog',
  templateUrl: './nueva-compra-dialog.component.html',
  styleUrls: ['./nueva-compra-dialog.component.scss'],
})
export class NuevaCompraDialogComponent implements OnInit {

  // Encabezado
  idProveedor   = 0;
  noFactura     = '';
  cai           = '';
  fecha         = new Date();
  porcentajeIsv = 0;
  descuento     = 0;
  observaciones = '';

  // Detalle
  lineas: LineaDetalle[] = [];
  columnas     = ['descripcion', 'cantidad', 'valorUnitario', 'total', 'del'];
  busquedaItem = '';

  guardando        = false;
  errorMsg         = '';
  proveedores:     ProveedorDto[]  = [];
  itemsInventario: InventarioDto[] = [];

  readonly opcionesIsv = [0, 15, 18];
  readonly displayVacio = () => '';

  constructor(
    public  dialogRef: MatDialogRef<NuevaCompraDialogComponent>,
    private comprasService: ComprasService,
    private provService: ProveedoresService,
    private invService: InventarioService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.provService.listar(undefined, undefined, true).subscribe(p => this.proveedores = p ?? []);
    this.invService.listar().subscribe(items => this.itemsInventario = items ?? []);
  }

  filtrarItems(query: string): InventarioDto[] {
    if (!query?.trim()) return this.itemsInventario;
    const q = query.toLowerCase();
    return this.itemsInventario.filter(i => i.nombre.toLowerCase().includes(q));
  }

  agregarDesdeBusqueda(item: InventarioDto): void {
    const existe = this.lineas.findIndex(l => l.idInventario === item.id);
    if (existe >= 0) {
      this.lineas[existe].cantidad++;
      this.lineas = [...this.lineas];
    } else {
      this.lineas = [...this.lineas, {
        idInventario:   item.id,
        descripcion:    item.nombre,
        categoria:      item.categoria,
        cantidad:       1,
        valorUnitario:  item.valorUnitario,
        cantExistente:  item.cantidad,
        valorExistente: item.valorUnitario,
      }];
    }
    this.busquedaItem = '';
  }

  promedioPonderado(l: LineaDetalle): number {
    if (!l.cantExistente || l.cantExistente <= 0) return l.valorUnitario;
    return ((l.cantExistente * (l.valorExistente ?? 0)) + (l.cantidad * l.valorUnitario))
         / (l.cantExistente + l.cantidad);
  }

  mostrarPonderado(l: LineaDetalle): boolean {
    return !!l.idInventario && !!l.cantExistente && l.cantExistente > 0;
  }

  eliminarLinea(i: number): void {
    this.lineas = this.lineas.filter((_, idx) => idx !== i);
  }

  totalLinea(l: LineaDetalle): number { return l.cantidad * l.valorUnitario; }

  get subtotal(): number { return this.lineas.reduce((s, l) => s + this.totalLinea(l), 0); }
  get isv(): number      { return this.subtotal * (this.porcentajeIsv / 100); }
  get total(): number    { return this.subtotal + this.isv - this.descuento; }

  get puedeGuardar(): boolean {
    return !this.guardando &&
      this.lineas.length > 0 &&
      this.lineas.every(l => l.cantidad > 0 && l.valorUnitario > 0);
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;
    this.errorMsg  = '';

    const items: CrearCompraItemDto[] = this.lineas.map(l => ({
      idInventario:  l.idInventario,
      descripcion:   l.descripcion.trim(),
      categoria:     l.categoria,
      cantidad:      l.cantidad,
      valorUnitario: l.valorUnitario,
    }));

    this.comprasService.crear({
      idProveedor:   this.idProveedor || undefined,
      noFactura:     this.noFactura.trim()     || undefined,
      cai:           this.cai.trim()           || undefined,
      fecha:         toLocalDateStr(this.fecha),
      porcentajeIsv: this.porcentajeIsv,
      descuento:     this.descuento,
      observaciones: this.observaciones.trim() || undefined,
      items,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.snack.open('Compra registrada. Stock actualizado y movimiento Kardex registrado.', 'OK', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.guardando = false;
        this.errorMsg = err?.error?.errores ?? err?.error?.message ?? 'Error al guardar la compra.';
      }
    });
  }

  maskFactura(event: Event): void {
    const el = event.target as HTMLInputElement;
    const cursor = el.selectionStart ?? 0;
    const prev   = el.value.length;
    const digits = el.value.replace(/\D/g, '').slice(0, 16);
    let masked = '';
    if (digits.length > 0) masked += digits.slice(0, 3);
    if (digits.length > 3) masked += '-' + digits.slice(3, 6);
    if (digits.length > 6) masked += '-' + digits.slice(6, 8);
    if (digits.length > 8) masked += '-' + digits.slice(8, 16);
    this.noFactura = masked;
    el.value = masked;
    const diff = masked.length - prev;
    setTimeout(() => el.setSelectionRange(cursor + diff, cursor + diff));
  }

  maskCai(event: Event): void {
    const el = event.target as HTMLInputElement;
    const cursor = el.selectionStart ?? 0;
    const prev   = el.value.length;
    const chars  = el.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32);
    let masked = '';
    if (chars.length > 0)  masked += chars.slice(0, 6);
    if (chars.length > 6)  masked += '-' + chars.slice(6, 12);
    if (chars.length > 12) masked += '-' + chars.slice(12, 18);
    if (chars.length > 18) masked += '-' + chars.slice(18, 24);
    if (chars.length > 24) masked += '-' + chars.slice(24, 30);
    if (chars.length > 30) masked += '-' + chars.slice(30, 32);
    this.cai = masked;
    el.value = masked;
    const diff = masked.length - prev;
    setTimeout(() => el.setSelectionRange(cursor + diff, cursor + diff));
  }

  formatLps(v: number): string { return this.comprasService.formatLps(v); }
}
