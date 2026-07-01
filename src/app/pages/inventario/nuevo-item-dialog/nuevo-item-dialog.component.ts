import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventarioService, CATEGORIAS_INVENTARIO, InventarioDto } from '@app/services/inventario/inventario.service';
import { toLocalDateStr } from '@app/utils/date.utils';

@Component({
  selector: 'app-nuevo-item-dialog',
  templateUrl: './nuevo-item-dialog.component.html',
  styleUrls: ['./nuevo-item-dialog.component.scss'],
})
export class NuevoItemDialogComponent implements OnInit {

  nombre           = '';
  categoria        = '';
  cantidad         = 1;
  valorUnitario    = 0;
  fechaAdquisicion = new Date();
  descripcion      = '';
  guardando        = false;
  errorMsg         = '';

  readonly categorias = CATEGORIAS_INVENTARIO;
  private nombresExistentes: string[] = [];

  get valorTotal(): number { return this.cantidad * this.valorUnitario; }

  get nombreDuplicado(): boolean {
    const n = this.nombre.trim().toLowerCase();
    return n.length > 0 && this.nombresExistentes.includes(n);
  }

  constructor(
    public  dialogRef: MatDialogRef<NuevoItemDialogComponent>,
    private invService: InventarioService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.invService.listar().subscribe(items => {
      this.nombresExistentes = (items ?? []).map(i => i.nombre.toLowerCase());
    });
  }

  get puedeGuardar(): boolean {
    return !!this.nombre.trim() && !!this.categoria &&
           this.cantidad > 0 && this.valorUnitario > 0 &&
           !this.nombreDuplicado && !this.guardando;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;
    this.errorMsg  = '';
    this.invService.guardar({
      nombre:           this.nombre.trim(),
      categoria:        this.categoria,
      cantidad:         this.cantidad,
      valorUnitario:    this.valorUnitario,
      fechaAdquisicion: toLocalDateStr(this.fechaAdquisicion),
      descripcion:      this.descripcion.trim() || undefined,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.snack.open('Ítem agregado al inventario', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMsg = err?.error?.errores ?? err?.error?.message ?? 'Error al guardar el ítem.';
      }
    });
  }
}
