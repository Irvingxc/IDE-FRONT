import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, switchMap } from 'rxjs';
import { forkJoin } from 'rxjs';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';

interface GradoConPrecio extends GradoDto {
  seleccionado: boolean;
  precio: number;
}

@Component({
  selector: 'app-nuevo-producto-dialog',
  templateUrl: './nuevo-producto-dialog.component.html',
  styleUrls: ['./nuevo-producto-dialog.component.scss'],
})
export class NuevoProductoDialogComponent implements OnInit {

  nombre      = '';
  descripcion = '';
  guardando   = false;

  agregarCxc = true;
  anioCxc    = new Date().getFullYear();

  grados: GradoConPrecio[] = [];

  constructor(
    public  dialogRef: MatDialogRef<NuevoProductoDialogComponent>,
    private catService: CatalogoService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.catService.getGrados().subscribe(grados => {
      this.grados = grados.map(g => ({ ...g, seleccionado: false, precio: 0 }));
    });
  }

  get puedeGuardar(): boolean {
    return !!this.nombre.trim() && !this.guardando;
  }

  toggleTodos(sel: boolean): void {
    this.grados.forEach(g => g.seleccionado = sel);
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;

    let nuevoId = 0;

    this.catService.crearProducto({
      nombre:      this.nombre.trim(),
      descripcion: this.descripcion.trim() || undefined,
    }).pipe(
      switchMap(({ id }) => {
        nuevoId = id;
        const conPrecio = this.grados.filter(g => g.seleccionado && g.precio > 0);
        if (!conPrecio.length) return of(null);
        return forkJoin(
          conPrecio.map(g =>
            this.catService.actualizarPrecio({ idGrado: g.idGrado, idProducto: id, precio: g.precio })
              .pipe(catchError(() => of(null)))
          )
        );
      }),
      switchMap(() => {
        if (!this.agregarCxc || !nuevoId) return of(null);
        return this.catService.generarCxcProducto(nuevoId, this.anioCxc)
          .pipe(catchError(() => of(null)));
      })
    ).subscribe({
      next: (res: any) => {
        this.guardando = false;
        const registros = res?.registrosGenerados ?? null;
        const msg = registros !== null
          ? `Producto creado. ${registros} registro(s) CXC generados para ${this.anioCxc}.`
          : 'Producto creado correctamente.';
        this.snack.open(msg, 'OK', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.snack.open(err?.error?.errores?.mensaje ?? err?.error?.errores ?? 'Error al crear el producto', '', { duration: 4000 });
      }
    });
  }
}
