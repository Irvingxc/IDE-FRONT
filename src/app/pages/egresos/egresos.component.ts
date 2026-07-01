import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { EgresosService, EgresoDto, CATEGORIAS_EGRESO } from '@app/services/egresos/egresos.service';
import { NuevoEgresoDialogComponent } from './nuevo-egreso-dialog/nuevo-egreso-dialog.component';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-egresos',
  templateUrl: './egresos.component.html',
  styleUrls: ['./egresos.component.scss']
})
export class EgresosComponent implements OnInit {

  columns    = ['fecha', 'categoria', 'concepto', 'monto', 'descripcion', 'acciones'];
  dataSource = new MatTableDataSource<EgresoDto>();
  cargando   = false;

  anio      = new Date().getFullYear();
  mes       = new Date().getMonth() + 1;
  categoria = '';

  readonly meses = [
    { val: 0,  label: 'Todos' },
    { val: 1,  label: 'Enero' },    { val: 2,  label: 'Febrero' },
    { val: 3,  label: 'Marzo' },    { val: 4,  label: 'Abril' },
    { val: 5,  label: 'Mayo' },     { val: 6,  label: 'Junio' },
    { val: 7,  label: 'Julio' },    { val: 8,  label: 'Agosto' },
    { val: 9,  label: 'Septiembre'},{ val: 10, label: 'Octubre' },
    { val: 11, label: 'Noviembre'}, { val: 12, label: 'Diciembre' },
  ];

  readonly categorias = CATEGORIAS_EGRESO;

  constructor(
    private egresosService: EgresosService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.egresosService.listar(this.anio, this.mes, this.categoria || undefined).subscribe({
      next: (data) => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()    => { this.cargando = false; }
    });
  }

  get totalMes(): number {
    return this.dataSource.data.reduce((s, e) => s + e.monto, 0);
  }

  get resumenCategorias(): { categoria: string; total: number }[] {
    const map = new Map<string, number>();
    this.dataSource.data.forEach(e => map.set(e.categoria, (map.get(e.categoria) ?? 0) + e.monto));
    return Array.from(map.entries()).map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }

  nuevoEgreso(): void {
    const ref = this.dialog.open(NuevoEgresoDialogComponent, {
      width: '480px', disableClose: true
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  eliminar(egreso: EgresoDto): void {
    if (!confirm(`¿Eliminar "${egreso.concepto}" por ${this.formatLps(egreso.monto)}?`)) return;
    this.egresosService.eliminar(egreso.id).subscribe({
      next: () => { this.snack.open('Egreso eliminado', '', { duration: 3000 }); this.cargar(); },
      error: (err) => this.snack.open(err?.error?.message ?? 'Error al eliminar', '', { duration: 4000 })
    });
  }

  formatLps(v: number): string { return this.egresosService.formatLps(v); }

  formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }
}
