import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SarService, SarItem } from '@app/services/sar/sar.service';
import { NuevoSarDialogComponent } from './nuevo-sar-dialog/nuevo-sar-dialog.component';
import { parseLocalDate } from '@app/utils/date.utils';

@Component({
  selector: 'app-sar-config',
  templateUrl: './sar-config.component.html',
  styleUrls: ['./sar-config.component.scss']
})
export class SarConfigComponent implements OnInit {

  columns    = ['estado', 'cai', 'rangoDel', 'rangoAl', 'secuencia', 'fechaLim', 'isv'];
  dataSource = new MatTableDataSource<SarItem>();
  cargando   = false;

  constructor(
    private svc: SarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.svc.listar().subscribe({
      next: data => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  nuevoCai(): void {
    const ref = this.dialog.open(NuevoSarDialogComponent, { width: '560px', disableClose: true });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

formatFecha(f: string): string {
    if (!f) return '—';
    const d = parseLocalDate(f);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-HN');
  }

  progreso(sar: SarItem): string {
    const seq = this.numFinal(sar.secuenciaSar);
    const del = this.numFinal(sar.rangoDel);
    const al  = this.numFinal(sar.rangoAl);
    if (!al || !del) return sar.secuenciaSar ?? '—';
    const usadas = seq - del + 1;
    const total  = al - del + 1;
    return `${usadas.toLocaleString()} / ${total.toLocaleString()}`;
  }

  private numFinal(rango: string | null | undefined): number {
    if (!rango) return 0;
    return parseInt(rango.replace(/\D/g, ''), 10) || 0;
  }
}
