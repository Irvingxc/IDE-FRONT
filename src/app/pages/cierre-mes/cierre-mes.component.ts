import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CierreMesService, CierreMesDto } from '@app/services/cierre-mes/cierre-mes.service';
import { CerrarMesDialogComponent } from './cerrar-mes-dialog/cerrar-mes-dialog.component';

@Component({
  selector: 'app-cierre-mes',
  templateUrl: './cierre-mes.component.html',
  styleUrls: ['./cierre-mes.component.scss']
})
export class CierreMesComponent implements OnInit {
  columns    = ['periodo', 'fechaCierre', 'totalIngresos', 'totalEgresos', 'resultado', 'observaciones'];
  dataSource = new MatTableDataSource<CierreMesDto>();
  cargando   = false;

  constructor(
    private svc: CierreMesService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.svc.listar().subscribe({
      next: data => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  abrirDialogCierre(): void {
    const ref = this.dialog.open(CerrarMesDialogComponent, { width: '460px', disableClose: true });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  nombreMes(m: number): string { return this.svc.nombreMes(m); }
  formatLps(v: number): string { return this.svc.formatLps(v); }

  formatFechaCierre(f: string): string {
    if (!f) return '—';
    const d = new Date(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
