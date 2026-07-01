import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CierreMesService, ResumenCierreMesDto } from '@app/services/cierre-mes/cierre-mes.service';

@Component({
  selector: 'app-cerrar-mes-dialog',
  templateUrl: './cerrar-mes-dialog.component.html',
  styleUrls: ['./cerrar-mes-dialog.component.scss']
})
export class CerrarMesDialogComponent implements OnInit {

  readonly meses = [
    { val: 1,  label: 'Enero' },    { val: 2,  label: 'Febrero' },
    { val: 3,  label: 'Marzo' },    { val: 4,  label: 'Abril' },
    { val: 5,  label: 'Mayo' },     { val: 6,  label: 'Junio' },
    { val: 7,  label: 'Julio' },    { val: 8,  label: 'Agosto' },
    { val: 9,  label: 'Septiembre'},{ val: 10, label: 'Octubre' },
    { val: 11, label: 'Noviembre'}, { val: 12, label: 'Diciembre' },
  ];

  anio    = new Date().getFullYear();
  mes     = new Date().getMonth() || 12;  // prev month (if Jan → 12)
  observaciones = '';

  resumen: ResumenCierreMesDto | null = null;
  cargandoResumen = false;
  guardando       = false;

  constructor(
    private dialogRef: MatDialogRef<CerrarMesDialogComponent>,
    private svc: CierreMesService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.cargarResumen(); }

  cargarResumen(): void {
    this.resumen = null;
    this.cargandoResumen = true;
    this.svc.obtenerResumen(this.anio, this.mes).subscribe({
      next:  r => { this.resumen = r; this.cargandoResumen = false; },
      error: () => { this.cargandoResumen = false; }
    });
  }

  get puedeConfirmar(): boolean {
    return !!this.resumen && !this.resumen.yaCerrado && !this.guardando;
  }

  confirmar(): void {
    if (!this.puedeConfirmar) return;
    this.guardando = true;
    this.svc.cerrarMes({ anio: this.anio, mes: this.mes, observaciones: this.observaciones || undefined }).subscribe({
      next: () => {
        this.snack.open('Período cerrado correctamente', '', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snack.open(err?.error?.message ?? 'Error al cerrar el período', '', { duration: 4000 });
        this.guardando = false;
      }
    });
  }

  formatLps(v: number): string { return this.svc.formatLps(v); }

  cancelar(): void { this.dialogRef.close(false); }
}
