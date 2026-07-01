import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import {
  PortalClienteService, HijoDto, PortalFacturaDto, PortalCxcDto
} from '@app/services/portal-cliente/portal-cliente.service';

@Component({
  selector: 'app-portal-cliente',
  templateUrl: './portal-cliente.component.html',
  styleUrls: ['./portal-cliente.component.scss']
})
export class PortalClienteComponent implements OnInit {

  user$!: Observable<any>;

  hijos: HijoDto[] = [];
  hijoSeleccionado: HijoDto | null = null;

  facturas: PortalFacturaDto[] = [];
  cxc: PortalCxcDto[] = [];
  anio = new Date().getFullYear();
  anios: number[] = [];

  cargandoHijos    = true;
  cargandoFacturas = false;
  cargandoCxc      = false;

  tabActiva = 0;

  readonly cxcColumns  = ['mes', 'producto', 'monto', 'vence', 'estado', 'fechaPago'];
  readonly facColumns  = ['noFactura', 'fecha', 'total', 'estado'];

  constructor(
    private store: Store<fromRoot.State>,
    public svc: PortalClienteService
  ) {}

  ngOnInit(): void {
    this.user$ = this.store.pipe(select(fromUser.getUser));
    const base = this.anio;
    this.anios = [base, base - 1, base - 2];

    this.svc.misHijos().subscribe({
      next: (h) => {
        this.hijos = h;
        this.cargandoHijos = false;
        if (h.length > 0) this.seleccionar(h[0]);
      },
      error: () => { this.cargandoHijos = false; }
    });
  }

  seleccionar(hijo: HijoDto): void {
    this.hijoSeleccionado = hijo;
    this.cargarFacturas();
    this.cargarCxc();
  }

  cargarFacturas(): void {
    this.cargandoFacturas = true;
    this.svc.misFacturas(this.hijoSeleccionado?.identidad).subscribe({
      next: (f) => { this.facturas = f; this.cargandoFacturas = false; },
      error: () => { this.cargandoFacturas = false; }
    });
  }

  cargarCxc(): void {
    this.cargandoCxc = true;
    this.svc.miCXC(this.hijoSeleccionado?.identidad, this.anio).subscribe({
      next: (c) => { this.cxc = c; this.cargandoCxc = false; },
      error: () => { this.cargandoCxc = false; }
    });
  }

  cambiarAnio(a: number): void {
    this.anio = a;
    this.cargarCxc();
  }

  get pendientes(): PortalCxcDto[] { return this.cxc.filter(c => c.estado === 'Pendiente'); }
  get pagadas():    PortalCxcDto[] { return this.cxc.filter(c => c.estado === 'Pagado'); }

  get totalPendiente(): number { return this.pendientes.reduce((s, c) => s + +c.monto, 0); }
  get totalPagado():    number { return this.pagadas.reduce((s, c) => s + +c.monto, 0); }
}
