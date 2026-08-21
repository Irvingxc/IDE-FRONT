import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import {
  PortalClienteService, HijoDto, PortalFacturaDto, PortalCxcDto, PortalPeriodo, PortalClaseNota, PortalAsistenciaDto
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

  notas: PortalClaseNota[] = [];
  periodos: PortalPeriodo[] = [];
  periodoSeleccionadoId: number | null = null;

  asistencia: PortalAsistenciaDto[] = [];
  anioAsistencia = new Date().getFullYear();
  mesAsistencia = new Date().getMonth() + 1;
  readonly meses = Array.from({ length: 12 }, (_, i) => i + 1);

  cargandoHijos    = true;
  cargandoFacturas = false;
  cargandoCxc      = false;
  cargandoNotas    = false;
  cargandoAsistencia = false;

  tabActiva = 0;

  readonly cxcColumns  = ['mes', 'producto', 'monto', 'vence', 'estado', 'fechaPago'];
  readonly facColumns  = ['noFactura', 'fecha', 'total', 'estado'];
  readonly notasResumenColumns = ['claseNombre', 'maestroNombre', 'total'];
  readonly asistenciaColumns = ['fecha', 'estado', 'horaMarca'];

  constructor(
    private store: Store<fromRoot.State>,
    private router: Router,
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

    this.svc.periodos().subscribe({
      next: (p) => {
        this.periodos = p;
        if (p.length > 0) {
          this.periodoSeleccionadoId = p[0].id;
          this.cargarNotas();
        }
      },
      error: () => {}
    });
  }

  seleccionar(hijo: HijoDto): void {
    this.hijoSeleccionado = hijo;
    this.cargarCxc();
    this.cargarNotas();
    this.cargarAsistencia();
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    this.store.dispatch(new fromUser.SignOut());
    this.router.navigate(['/']);
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

  cargarNotas(): void {
    if (!this.hijoSeleccionado || !this.periodoSeleccionadoId) { this.notas = []; return; }
    this.cargandoNotas = true;
    this.svc.misNotas(this.hijoSeleccionado.identidad, this.periodoSeleccionadoId).subscribe({
      next: (n) => { this.notas = n; this.cargandoNotas = false; },
      error: () => { this.notas = []; this.cargandoNotas = false; }
    });
  }

  cambiarPeriodo(idPeriodo: number): void {
    this.periodoSeleccionadoId = idPeriodo;
    this.cargarNotas();
  }

  cargarAsistencia(): void {
    if (!this.hijoSeleccionado) { this.asistencia = []; return; }
    this.cargandoAsistencia = true;
    this.svc.miAsistencia(this.hijoSeleccionado.identidad, this.anioAsistencia, this.mesAsistencia).subscribe({
      next: (a) => { this.asistencia = a; this.cargandoAsistencia = false; },
      error: () => { this.asistencia = []; this.cargandoAsistencia = false; }
    });
  }

  cambiarMesAsistencia(mes: number): void {
    this.mesAsistencia = mes;
    this.cargarAsistencia();
  }

  cambiarAnioAsistencia(anio: number): void {
    this.anioAsistencia = anio;
    this.cargarAsistencia();
  }

  get totalPresentesAsistencia(): number {
    return this.asistencia.filter(a => a.estado === 'Presente').length;
  }

  get totalAusentesAsistencia(): number {
    return this.asistencia.filter(a => a.estado === 'Ausente').length;
  }

  totalClase(clase: PortalClaseNota): number {
    return clase.conceptos.reduce((sumaConceptos, concepto) =>
      sumaConceptos + concepto.actividades.reduce((sumaActividades, actividad) =>
        sumaActividades + (actividad.nota ?? 0), 0), 0);
  }

  get pendientes(): PortalCxcDto[] { return this.cxc.filter(c => c.estado === 'Pendiente'); }
  get pagadas():    PortalCxcDto[] { return this.cxc.filter(c => c.estado === 'Pagado'); }

  get totalPendiente(): number { return this.pendientes.reduce((s, c) => s + +c.monto, 0); }
  get totalPagado():    number { return this.pagadas.reduce((s, c) => s + +c.monto, 0); }
}
