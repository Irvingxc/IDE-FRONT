import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FacturacionService, PagoResumen, PagoDetalle } from '@app/services/facturacion/facturacion.service';
import { NuevaFacturaDialogComponent, NuevaFacturaDialogData } from './nueva-factura-dialog/nueva-factura-dialog.component';

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss']
})
export class FacturacionComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columns    = ['noFactura', 'fecha', 'alumno', 'grado', 'total', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<PagoResumen>();
  cargando   = false;
  anio      = new Date().getFullYear();
  mes       = 0;
  filtroAlumno  = '';
  filtroEstado  = '';

  readonly meses = [
    { val: 0,  label: 'Todos' },
    { val: 1,  label: 'Enero' },    { val: 2,  label: 'Febrero' },
    { val: 3,  label: 'Marzo' },    { val: 4,  label: 'Abril' },
    { val: 5,  label: 'Mayo' },     { val: 6,  label: 'Junio' },
    { val: 7,  label: 'Julio' },    { val: 8,  label: 'Agosto' },
    { val: 9,  label: 'Septiembre'},{ val: 10, label: 'Octubre' },
    { val: 11, label: 'Noviembre'}, { val: 12, label: 'Diciembre' },
  ];

  constructor(
    private facturacionService: FacturacionService,
    private dialog: MatDialog,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.cargar();
    // Si viene desde CXC (navegación con estado), abrir dialog pre-cargado
    const state = history.state as NuevaFacturaDialogData & { fromCxc?: boolean };
    if (state?.fromCxc) {
      // Limpiar el estado del history para no re-abrir en reload
      history.replaceState({}, '');
      setTimeout(() => this.abrirDialog(state), 300);
    }
  }

  cargar(): void {
    this.cargando = true;
    this.facturacionService.getListarPagos(this.anio, this.mes, this.filtroAlumno, this.filtroEstado).subscribe({
      next: (data) => { this.dataSource.data = data ?? []; this.cargando = false; },
      error: ()     => { this.cargando = false; }
    });
  }

  nuevaFactura(): void {
    this.abrirDialog({ fromCxc: false, alumnoIdentidad: '', alumnoNombre: '', alumnoTutor: '', gradoNombre: '', items: [], idsCxc: [] });
  }

  private abrirDialog(data: NuevaFacturaDialogData): void {
    const ref = this.dialog.open(NuevaFacturaDialogComponent, {
      width: '820px',
      maxWidth: '96vw',
      disableClose: true,
      data
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargar(); });
  }

  anular(pago: PagoResumen): void {
    if (!confirm(`¿Anular la factura ${pago.noFactura} de ${pago.nombreAlumno}? Esta acción no se puede deshacer.`)) return;
    this.facturacionService.anularFactura(pago.id).subscribe({
      next: () => {
        this.snack.open('Factura anulada correctamente', '', { duration: 3000 });
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al anular la factura';
        this.snack.open(msg, '', { duration: 4000 });
      }
    });
  }

  imprimir(pago: PagoResumen): void {
    this.facturacionService.getDetalle(pago.id).subscribe(detalle => {
      this.abrirVentanaImpresion(detalle);
    });
  }

  formatLps(v: number): string { return this.facturacionService.formatLps(v); }

  limpiar(): void {
    this.filtroAlumno = '';
    this.filtroEstado = '';
    this.mes = 0;
    this.cargar();
  }

  private abrirVentanaImpresion(p: PagoDetalle): void {
    this.facturacionService.imprimirHtml(this.facturacionService.buildFacturaHtml(p));
  }

}
