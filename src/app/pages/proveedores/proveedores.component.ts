import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProveedoresService, ProveedorDto, CATEGORIAS_PROVEEDOR } from '@app/services/proveedores/proveedores.service';
import { ProveedorDialogComponent } from './proveedor-dialog/proveedor-dialog.component';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss']
})
export class ProveedoresComponent implements OnInit {

  columns    = ['nombre', 'rtn', 'telefono', 'contacto', 'categoria', 'activo', 'acciones'];
  datos:     ProveedorDto[] = [];
  cargando   = false;

  filtroNombre    = '';
  filtroCategoria = '';
  soloActivos     = true;

  readonly categorias = CATEGORIAS_PROVEEDOR;

  constructor(
    private provService: ProveedoresService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.provService.listar(
      this.filtroNombre    || undefined,
      this.filtroCategoria || undefined,
      this.soloActivos
    ).subscribe({
      next: (data) => { this.datos = data ?? []; this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  abrirDialog(proveedor?: ProveedorDto): void {
    const ref = this.dialog.open(ProveedorDialogComponent, {
      width: '600px',
      disableClose: true,
      data: proveedor ?? null
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  limpiar(): void {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.cargar();
  }
}
