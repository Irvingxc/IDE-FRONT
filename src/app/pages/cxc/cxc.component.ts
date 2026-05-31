import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CxcService, CxcResumen } from '@app/services/cxc/cxc.service';
import { EstadoCuentaDialogComponent } from './estado-cuenta-dialog/estado-cuenta-dialog.component';

@Component({
  selector: 'app-cxc',
  templateUrl: './cxc.component.html',
  styleUrls: ['./cxc.component.scss']
})
export class CxcComponent implements OnInit {

  columns = ['nombre', 'grado', 'cuotasPendientes', 'totalPendiente', 'totalPagado'];
  datos: CxcResumen[] = [];
  cargando      = false;
  generando     = false;
  anio          = new Date().getFullYear();
  filtroNombre  = '';
  filtroEstado  = '';

  aniosGenerados: Set<number> = new Set();
  readonly aniosDisponibles: number[] = (() => {
    const base = new Date().getFullYear();
    return [base - 2, base - 1, base, base + 1];
  })();

  constructor(
    private cxcService: CxcService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarAniosGenerados();
  }

  cargarAniosGenerados(): void {
    this.cxcService.getAniosGenerados().subscribe({
      next: (lista) => { this.aniosGenerados = new Set(lista); }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.cxcService.getResumen(
      this.anio,
      this.filtroNombre || undefined,
      this.filtroEstado || undefined
    ).subscribe({
      next: (data) => { this.datos = data ?? []; this.cargando = false; },
      error: ()     => { this.cargando = false; }
    });
  }

  rowClass(row: CxcResumen): string {
    if (row.cuotasPendientes > 3) return 'fila-roja';
    if (row.cuotasPendientes > 0) return 'fila-amarilla';
    return '';
  }

  generarCxc(anioSeleccionado: number): void {
    if (this.generando || this.aniosGenerados.has(anioSeleccionado)) return;
    this.generando = true;
    this.cxcService.generarAnio(anioSeleccionado).subscribe({
      next: () => {
        this.generando = false;
        this.aniosGenerados = new Set([...this.aniosGenerados, anioSeleccionado]);
        this.snack.open(`CXC ${anioSeleccionado} generado correctamente`, '', { duration: 3000 });
        if (this.anio === anioSeleccionado) this.cargar();
      },
      error: () => {
        this.generando = false;
        this.snack.open('Error al generar CXC', '', { duration: 4000 });
      }
    });
  }

  abrirEstadoCuenta(row: CxcResumen): void {
    this.dialog.open(EstadoCuentaDialogComponent, {
      width: '760px',
      data: { identidad: row.identidad, nombre: row.nombreCompleto, anio: this.anio, gradoNombre: row.gradoNombre }
    });
  }

  limpiar(): void {
    this.filtroNombre = '';
    this.filtroEstado = '';
    this.cargar();
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  get totalPendienteGlobal(): number {
    return this.datos.reduce((s, r) => s + r.totalPendiente, 0);
  }

  get totalPagadoGlobal(): number {
    return this.datos.reduce((s, r) => s + r.totalPagado, 0);
  }
}
