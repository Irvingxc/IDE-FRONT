import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { BitacoraService, BitacoraItem } from '@app/services/bitacora/bitacora.service';

const MODULOS = ['FAC', 'MAT', 'EST', 'CXC', 'CAT', 'PAGOS', 'MATRICULAS', 'EMPLEADOS', 'INVENTARIO', 'ENTRADAS', 'WHATSAPP', 'REPORTES', 'BITACORA', 'CONTABILIDAD'];

@Component({
  selector: 'app-bitacora',
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.scss']
})
export class BitacoraComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columnas = ['fecha', 'usuario', 'modulo', 'accion'];
  datos: BitacoraItem[] = [];
  total  = 0;
  pagina = 1;
  registros = 20;
  cargando = false;

  modulos = MODULOS;

  filtros: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bitacoraService: BitacoraService
  ) {
    this.filtros = this.fb.group({
      usuario:    [''],
      modulo:     [''],
      accion:     [''],
      fechaDesde: [null],
      fechaHasta: [null],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const v = this.filtros.value;

    this.bitacoraService.getBitacora({
      usuario:    v.usuario    || undefined,
      modulo:     v.modulo     || undefined,
      accion:     v.accion     || undefined,
      fechaDesde: v.fechaDesde ? this.toIso(v.fechaDesde) : undefined,
      fechaHasta: v.fechaHasta ? this.toIso(v.fechaHasta) : undefined,
      pagina:     this.pagina,
      registros:  this.registros,
    }).subscribe({
      next: (data) => {
        this.datos  = data;
        this.total  = data.length > 0 ? data[0].total : 0;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  buscar(): void {
    this.pagina = 1;
    if (this.paginator) this.paginator.firstPage();
    this.cargar();
  }

  limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  onPage(e: PageEvent): void {
    this.pagina    = e.pageIndex + 1;
    this.registros = e.pageSize;
    this.cargar();
  }

  private toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  accionColor(accion: string): string {
    const a = accion.toLowerCase();
    if (a.includes('elimin') || a.includes('borr')) return 'red';
    if (a.includes('cre') || a.includes('regist') || a.includes('insert')) return 'green';
    if (a.includes('edit') || a.includes('actual') || a.includes('modif')) return 'blue';
    return 'gray';
  }
}
