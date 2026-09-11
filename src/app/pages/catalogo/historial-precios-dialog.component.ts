import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CatalogoService, HistorialPrecio } from '@app/services/catalogo/catalogo.service';

interface Grupo {
  idProducto:     number;
  productoNombre: string;
  vigencias:      HistorialPrecio[];
}

@Component({
  selector: 'app-historial-precios-dialog',
  template: `
    <h2 mat-dialog-title>Historial de precios — {{ data.gradoNombre }}</h2>
    <mat-dialog-content>
      <div *ngIf="cargando" class="cargando">Cargando…</div>
      <div *ngIf="!cargando && grupos.length === 0" class="vacio">Sin precios registrados.</div>

      <div class="grupo" *ngFor="let g of grupos">
        <h3>{{ g.productoNombre }}</h3>
        <table>
          <tr><th>Precio</th><th>Desde</th><th>Hasta</th><th>Anual</th><th></th></tr>
          <tr *ngFor="let v of g.vigencias" [class.vigente]="v.vigente">
            <td>L. {{ v.precio | number:'1.2-2' }}</td>
            <td>{{ v.fechaDesde | date:'dd/MM/yyyy' }}</td>
            <td>{{ v.fechaHasta ? (v.fechaHasta | date:'dd/MM/yyyy') : 'abierto' }}</td>
            <td>{{ v.esAnual ? 'Sí' : 'No' }}</td>
            <td><span class="badge" *ngIf="v.vigente">vigente</span></td>
          </tr>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 480px; }
    .cargando, .vacio { padding: 20px 0; color: #777; }
    .grupo { margin-bottom: 16px; }
    .grupo h3 { margin: 0 0 6px; font-size: 13px; color: #6B0F1A; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 4px 8px; color: #666; background: #f5f5f5; }
    td { padding: 4px 8px; border-bottom: 1px solid #eee; }
    tr.vigente td { font-weight: 600; }
    .badge { background: #e8f5e9; color: #2e7d32; border-radius: 8px; padding: 1px 7px; font-size: 11px; }
  `]
})
export class HistorialPreciosDialogComponent implements OnInit {
  cargando = true;
  grupos: Grupo[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { idGrado: number; gradoNombre: string },
    private catService: CatalogoService
  ) {}

  ngOnInit(): void {
    this.catService.getHistorialPrecios(this.data.idGrado).subscribe({
      next: rows => {
        const map = new Map<number, Grupo>();
        (rows ?? []).forEach(r => {
          if (!map.has(r.idProducto)) {
            map.set(r.idProducto, { idProducto: r.idProducto, productoNombre: r.productoNombre ?? ('Producto ' + r.idProducto), vigencias: [] });
          }
          map.get(r.idProducto)!.vigencias.push(r);
        });
        this.grupos = Array.from(map.values());
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }
}
