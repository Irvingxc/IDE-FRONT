import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogoService, GradoPrecioFlat } from '@app/services/catalogo/catalogo.service';
import { NuevoProductoDialogComponent } from './nuevo-producto-dialog/nuevo-producto-dialog.component';

interface PrecioItem {
  idProducto:     number;
  productoNombre: string;
  precio:         number;
  original:       number;
}

interface GradoRow {
  idGrado:   number;
  nombre:    string;
  nivel:     string;
  precios:   PrecioItem[];
  guardando: boolean;
  get modificado(): boolean;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
export class CatalogoComponent implements OnInit {

  cargando   = false;
  filas:     GradoRow[] = [];
  productos: { id: number; nombre: string }[] = [];
  columnas:  string[] = [];
  nivelFiltro = '';

  constructor(
    private catService: CatalogoService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.catService.getGradosConPrecios().subscribe({
      next: (data) => {
        this.construir(data);
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private construir(data: GradoPrecioFlat[]): void {
    const prodMap = new Map<number, string>();
    data.forEach(d => prodMap.set(d.idProducto, d.productoNombre));
    this.productos = Array.from(prodMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    this.columnas  = ['nivel', 'grado', ...this.productos.map(p => 'p_' + p.id), 'acciones'];

    const gradoMap = new Map<number, GradoRow>();
    data.forEach(d => {
      if (!gradoMap.has(d.idGrado)) {
        const row: GradoRow = {
          idGrado:   d.idGrado,
          nombre:    d.gradoNombre,
          nivel:     d.nivel,
          precios:   [],
          guardando: false,
          get modificado() {
            return this.precios.some(p => p.precio !== p.original);
          }
        };
        gradoMap.set(d.idGrado, row);
      }
      gradoMap.get(d.idGrado)!.precios.push({
        idProducto:     d.idProducto,
        productoNombre: d.productoNombre,
        precio:         d.precio,
        original:       d.precio,
      });
    });

    this.filas = Array.from(gradoMap.values());
  }

  get filasFiltradas(): GradoRow[] {
    if (!this.nivelFiltro) return this.filas;
    return this.filas.filter(f => f.nivel === this.nivelFiltro);
  }

  get niveles(): string[] {
    return [...new Set(this.filas.map(f => f.nivel))];
  }

  getPrecio(row: GradoRow, idProducto: number): PrecioItem {
    return row.precios.find(p => p.idProducto === idProducto)!;
  }

  guardar(row: GradoRow): void {
    const modificados = row.precios.filter(p => p.precio !== p.original);
    if (!modificados.length) return;

    row.guardando = true;
    let pendientes = modificados.length;

    modificados.forEach(p => {
      this.catService.actualizarPrecio({
        idGrado:    row.idGrado,
        idProducto: p.idProducto,
        precio:     p.precio,
      }).subscribe({
        next: () => {
          p.original = p.precio;
          pendientes--;
          if (pendientes === 0) {
            row.guardando = false;
            this.snack.open('Precios actualizados', 'OK', { duration: 2500 });
          }
        },
        error: () => {
          row.guardando = false;
          this.snack.open('Error al guardar', 'OK', { duration: 3000 });
        }
      });
    });
  }

  cancelar(row: GradoRow): void {
    row.precios.forEach(p => p.precio = p.original);
  }

  nuevoProducto(): void {
    const ref = this.dialog.open(NuevoProductoDialogComponent, {
      width: '600px',
      maxWidth: '96vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  confirmarInactivar(prod: { id: number; nombre: string }): void {
    if (!confirm(`¿Inactivar el producto "${prod.nombre}"? Ya no aparecerá en el catálogo ni en nuevas facturas.`)) return;
    this.catService.inactivarProducto(prod.id).subscribe({
      next: () => {
        this.snack.open(`Producto "${prod.nombre}" inactivado`, 'OK', { duration: 3000 });
        this.cargar();
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? 'Error al inactivar', 'OK', { duration: 4000 });
      }
    });
  }
}
