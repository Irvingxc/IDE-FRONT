import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { DashboardService } from '@app/services/dashboard/dashboard.service';
import { MatriculaService } from '@app/services/matricula/matricula.service';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

/** Alerta "Promover grado antes de..." (fin de año lectivo). */
interface AlertaPromocion {
  nivel:       'info' | 'advertencia' | 'urgente';
  titulo:      string;
  detalle:     string;
  puedeIr:     boolean;   // Administrador/Director: botón a Promoción de grado
}

/** Roles que ven la alerta de promoción. */
const ROLES_ALERTA_PROMOCION = ['Administrador', 'Director', 'Secretaria'];
/** Roles que pueden promover (el backend lo exige). */
const ROLES_PROMUEVEN = ['Administrador', 'Director'];
/** Desde qué mes se avisa (0 = enero): octubre. */
const MES_INICIO_AVISO = 9;

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
  { icon: 'mail',            title: 'Correos',                subtitle: 'Correos y avisos a padres',     status: 'Activo', color: '#1565C0', route: '/correos',                 modulo: 'WHATSAPP'   },
  { icon: 'grade',           title: 'Notas',                  subtitle: 'Períodos, materias y calificaciones', status: 'Nuevo', color: '#8E24AA', route: '/academico',         modulo: 'ACADEMICO'  },
  { icon: 'bar_chart',       title: 'Reportes',               subtitle: 'Estadísticas y libros',         status: 'Activo', color: '#607D8B', route: '/reportes',                modulo: 'REPORTES'   },
  { icon: 'account_balance', title: 'Contabilidad',           subtitle: 'Ingresos, egresos y balances',  status: 'Nuevo',  color: '#6B0F1A', route: '/contabilidad',            modulo: 'CONTABILIDAD'},
  { icon: 'account_balance_wallet', title: 'Cuentas por Cobrar', subtitle: 'Mensualidades y matrículas',    status: 'Activo', color: '#6B0F1A', route: '/cxc',                     modulo: 'CXC'         },
  { icon: 'history',         title: 'Bitácora',               subtitle: 'Registro de actividad',         status: 'Activo', color: '#37474F', route: '/bitacora',                modulo: 'BITACORA'    },
  { icon: 'schedule',        title: 'Mi asistencia',          subtitle: 'Mis horas de entrada y salida', status: 'Nuevo',  color: '#00796B', route: '/mi-asistencia',           modulo: 'MI_ASISTENCIA' },
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
  mostrarStats$!: Observable<boolean>;

  stats: StatCard[] = [
    { icon: 'people',        label: 'Estudiantes activos', value: '—', sub: '' },
    { icon: 'receipt_long',  label: 'Facturas emitidas',   value: '—', sub: '' },
    { icon: 'warning_amber', label: 'Pagos pendientes',    value: '—', sub: 'Vencidos esta semana' },
    { icon: 'fact_check',    label: 'Asistencia hoy',      value: '—', sub: '' },
  ];

  alertaPromocion: AlertaPromocion | null = null;

  constructor(
    private dashboardService: DashboardService,
    private matriculaService: MatriculaService,
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

    this.mostrarStats$ = this.store.pipe(
      select(fromUser.getUser),
      map(u => {
        const modulos = u?.modulos;
        if (!modulos) return true;
        return modulos.includes('MATRICULAS') || modulos.includes('PAGOS');
      })
    );

    this.mostrarStats$.pipe(take(1)).subscribe(mostrar => {
      if (mostrar) this.loadStats();
      else this.loadingStats = false;
    });

    this.store.pipe(select(fromUser.getUser), take(1)).subscribe(u => this.cargarAlertaPromocion(u?.roles ?? []));
  }

  /**
   * Del 1 de octubre al 31 de diciembre: "Promover grado antes del 31 de diciembre",
   * con los días que faltan (el 1 de enero se activan las prematrículas del año nuevo).
   * En enero, si quedaron alumnos sin promover, la misma alerta como vencida.
   * Solo se muestra si hay alumnos activos pendientes de promover.
   */
  private cargarAlertaPromocion(roles: string[]): void {
    if (!roles.some(r => ROLES_ALERTA_PROMOCION.includes(r))) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mes = hoy.getMonth();
    const enAviso = mes >= MES_INICIO_AVISO;
    const vencida = mes === 0;
    if (!enAviso && !vencida) return;

    const anioOrigen = vencida ? hoy.getFullYear() - 1 : hoy.getFullYear();
    const limite = new Date(anioOrigen, 11, 31);
    const dias = Math.round((limite.getTime() - hoy.getTime()) / 86_400_000);
    const puedeIr = roles.some(r => ROLES_PROMUEVEN.includes(r));

    this.matriculaService.pendientesPromocion(anioOrigen).subscribe({
      next: (r) => {
        if (!r || r.pendientes <= 0) return;
        const alumnos = `${r.pendientes} de ${r.totalActivos} alumno(s) activo(s) de ${anioOrigen} aún no se han promovido a ${anioOrigen + 1}.`;

        if (vencida) {
          this.alertaPromocion = {
            nivel: 'urgente',
            titulo: `Promoción de grado ${anioOrigen} pendiente`,
            detalle: `Ya inició ${anioOrigen + 1} y ${alumnos.charAt(0).toLowerCase()}${alumnos.slice(1)} ` +
                     `Promuévalos antes de generar las cuotas de ${anioOrigen + 1}.`,
            puedeIr,
          };
          return;
        }

        const cuando = dias === 0 ? 'Hoy es el último día.'
                     : dias === 1 ? 'Falta 1 día.'
                     : `Faltan ${dias} días.`;
        this.alertaPromocion = {
          nivel: dias <= 7 ? 'urgente' : dias <= 30 ? 'advertencia' : 'info',
          titulo: `Promover grado antes del 31 de diciembre de ${anioOrigen}`,
          detalle: `${cuando} ${alumnos}`,
          puedeIr,
        };
      },
      error: () => { /* sin alerta si no se pudo consultar */ }
    });
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

          this.stats[3].value = `${data.asistenciaHoy}/${data.estudiantesActivos}`;
          const pct = data.estudiantesActivos > 0
            ? Math.round((data.asistenciaHoy / data.estudiantesActivos) * 100)
            : 0;
          this.stats[3].sub = `${pct}% de asistencia`;
        } else {
          this.stats[0].value = '0';
          this.stats[1].value = '0';
          this.stats[2].value = '0';
          this.stats[3].value = '0';
        }
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
      }
    });
  }
}
