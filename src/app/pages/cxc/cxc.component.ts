import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
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

  esAdmin = false;

  constructor(
    private cxcService: CxcService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private store: Store<fromRoot.State>
  ) {}

  ngOnInit(): void {
    this.store.pipe(select(fromUser.getUserState)).subscribe(u => {
      const roles: string[] = (u?.entity as any)?.roles ?? [];
      this.esAdmin = roles.some((r: string) => r === 'Administrador' || r === 'Director');
    });
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
      width: '1000px',
      data: { identidad: row.identidad, nombre: row.nombreCompleto, anio: this.anio, gradoNombre: row.gradoNombre, esAdmin: this.esAdmin }
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

  exportarExcel(): void {
    const lps = (v: number) => v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const headers = ['Alumno', 'Padre/Tutor', 'Grado', 'Cuotas Pendientes', 'Total Vencido', 'Total Pagado', 'Total Año'];
    const rows = this.datos.map(r => [
      r.nombreCompleto,
      r.nombreTutor,
      r.gradoNombre,
      r.cuotasPendientes,
      lps(r.totalPendiente),
      lps(r.totalPagado),
      lps(r.totalDeudaAnio),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `CXC_${this.anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
