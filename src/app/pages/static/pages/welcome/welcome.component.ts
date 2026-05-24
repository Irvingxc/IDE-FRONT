import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardService } from '@app/services/dashboard/dashboard.service';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

interface StatCard {
  icon: string;
  label: string;
  value: string;
  sub: string;
}

interface ModuleCard {
  icon: string;
  title: string;
  subtitle: string;
  status: 'Activo' | 'Nuevo' | 'Inactivo';
  color: string;
  route: string;
  modulo: string;
}

const ALL_MODULES: ModuleCard[] = [
  { icon: 'school',          title: 'Matrículas',             subtitle: 'Inscripciones y expedientes',   status: 'Activo', color: '#3F51B5', route: '/matriculas',              modulo: 'MATRICULAS' },
  { icon: 'receipt_long',    title: 'Facturar',               subtitle: 'CAI, rangos, ISV',              status: 'Activo', color: '#4CAF50', route: '/facturacion',             modulo: 'PAGOS'      },
  { icon: 'inventory_2',     title: 'Inventario',             subtitle: 'Mobiliario, equipo y pupitres', status: 'Activo', color: '#009688', route: '/inventario',              modulo: 'INVENTARIO' },
  { icon: 'shopping_cart',   title: 'Compras / Entradas',     subtitle: 'Órdenes y proveedores',         status: 'Activo', color: '#9C27B0', route: '/compras',                 modulo: 'ENTRADAS'   },
  { icon: 'badge',           title: 'Empleados',              subtitle: 'Docentes y personal',           status: 'Activo', color: '#F44336', route: '/empleados',               modulo: 'EMPLEADOS'  },
  { icon: 'chat',            title: 'WhatsApp',               subtitle: 'Notificaciones a padres',       status: 'Nuevo',  color: '#25D366', route: '/whatsapp',                modulo: 'WHATSAPP'   },
  { icon: 'bar_chart',       title: 'Reportes',               subtitle: 'Estadísticas y libros',         status: 'Activo', color: '#607D8B', route: '/reportes',                modulo: 'REPORTES'   },
  { icon: 'account_balance', title: 'Contabilidad',           subtitle: 'Ingresos, egresos y balances',  status: 'Nuevo',  color: '#6B0F1A', route: '/contabilidad',            modulo: 'CONTABILIDAD'},
  { icon: 'account_balance_wallet', title: 'Cuentas por Cobrar', subtitle: 'Mensualidades y matrículas',    status: 'Activo', color: '#6B0F1A', route: '/cxc',                     modulo: 'CXC'         },
  { icon: 'history',         title: 'Bitácora',               subtitle: 'Registro de actividad',         status: 'Activo', color: '#37474F', route: '/bitacora',                modulo: 'BITACORA'    },
];

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  currentDate = '';
  schoolYear = new Date().getFullYear();
  loadingStats = true;

  nombreUsuario$!: Observable<string>;
  modules$!: Observable<ModuleCard[]>;

  stats: StatCard[] = [
    { icon: 'people',        label: 'Estudiantes activos', value: '—', sub: '' },
    { icon: 'receipt_long',  label: 'Facturas emitidas',   value: '—', sub: '' },
    { icon: 'warning_amber', label: 'Pagos pendientes',    value: '—', sub: 'Vencidos esta semana' },
    { icon: 'fact_check',    label: 'Asistencia hoy',      value: '—', sub: '' },
  ];

  constructor(
    private dashboardService: DashboardService,
    private store: Store<fromRoot.State>
  ) {}

  ngOnInit(): void {
    this.currentDate = new Date().toLocaleDateString('es-HN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    this.currentDate = this.currentDate.charAt(0).toUpperCase() + this.currentDate.slice(1);

    this.nombreUsuario$ = this.store.pipe(
      select(fromUser.getUser),
      map(u => u?.nombre ?? 'Usuario')
    );

    this.modules$ = this.store.pipe(
      select(fromUser.getUser),
      map(u => {
        const modulos = u?.modulos;
        if (!modulos) return ALL_MODULES;
        return ALL_MODULES.filter(m => modulos.includes(m.modulo));
      })
    );

    this.loadStats();
  }

  private loadStats(): void {
    this.loadingStats = true;
    this.dashboardService.getHome().subscribe({
      next: (data) => {
        if (data) {
          this.stats[0].value = data.estudiantesActivos.toString();
          this.stats[1].value = data.facturasEmitidas.toString();
          this.stats[1].sub   = data.mesFacturas;
          this.stats[2].value = data.pagosPendientes.toString();
        } else {
          this.stats[0].value = '0';
          this.stats[1].value = '0';
          this.stats[2].value = '0';
        }
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
      }
    });
  }
}
