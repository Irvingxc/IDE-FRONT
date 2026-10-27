import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SeguridadService, SesionActiva, CuentaBloqueada, RechazoLimite } from '@app/services/seguridad/seguridad.service';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
  selector: 'app-seguridad',
  templateUrl: './seguridad.component.html',
  styleUrls: ['./seguridad.component.scss'],
})
export class SeguridadComponent implements OnInit {
  /** Sesión que se está usando ahora (viene en el token): no se puede cerrar desde aquí, solo con Salir. */
  idSesionActual: string | null = null;

  sesiones: SesionActiva[] = [];
  bloqueadas: CuentaBloqueada[] = [];
  rechazos: RechazoLimite[] = [];
  horasRechazos = 24;

  cargando = false;
  procesando: Record<string, boolean> = {};

  readonly colSesiones   = ['usuario', 'roles', 'inicio', 'actividad', 'equipo', 'acciones'];
  readonly colBloqueadas = ['usuario', 'roles', 'intentos', 'estado', 'acciones'];
  readonly colRechazos   = ['ultimo', 'ip', 'ruta', 'cantidad'];

  constructor(private seguridad: SeguridadService, private notification: NotificationService) {}

  ngOnInit(): void {
    try {
      const token = localStorage.getItem('token') ?? '';
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      this.idSesionActual = payload?.idSesion ?? null;
    } catch { this.idSesionActual = null; }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    forkJoin({
      sesiones:   this.seguridad.sesiones(),
      bloqueadas: this.seguridad.cuentasBloqueadas(),
      rechazos:   this.seguridad.rechazos(this.horasRechazos),
    }).subscribe({
      next: ({ sesiones, bloqueadas, rechazos }) => {
        this.sesiones = sesiones;
        this.bloqueadas = bloqueadas;
        this.rechazos = rechazos;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo cargar la información de seguridad.');
      },
    });
  }

  cambiarHorasRechazos(horas: number): void {
    this.horasRechazos = horas;
    this.seguridad.rechazos(horas).subscribe(r => this.rechazos = r);
  }

  esSesionActual(s: SesionActiva): boolean {
    return !!this.idSesionActual && s.idSesion.toLowerCase() === this.idSesionActual.toLowerCase();
  }

  /** Minutos desde la última actividad, para mostrar "hace X min". */
  minutosDesde(fecha: string): number {
    return Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  }

  /** Navegador y sistema resumidos a partir del User-Agent. */
  equipo(ua: string | null): string {
    if (!ua) return '—';
    const so = /Android/i.test(ua) ? 'Android'
             : /iPhone|iPad|iOS/i.test(ua) ? 'iPhone/iPad'
             : /Windows/i.test(ua) ? 'Windows'
             : /Mac OS/i.test(ua) ? 'Mac'
             : /Linux/i.test(ua) ? 'Linux' : 'Otro';
    const nav = /Edg\//i.test(ua) ? 'Edge'
              : /OPR\//i.test(ua) ? 'Opera'
              : /Chrome\//i.test(ua) ? 'Chrome'
              : /Firefox\//i.test(ua) ? 'Firefox'
              : /Safari\//i.test(ua) ? 'Safari' : 'Navegador';
    return `${nav} · ${so}`;
  }

  cerrar(s: SesionActiva): void {
    if (!confirm(`¿Cerrar la sesión de ${s.usuario || s.email}? Saldrá del sistema en su siguiente acción.`)) return;
    this.procesando[s.idSesion] = true;
    this.seguridad.cerrarSesion(s.idSesion).subscribe({
      next: () => {
        this.procesando[s.idSesion] = false;
        this.sesiones = this.sesiones.filter(x => x.idSesion !== s.idSesion);
        this.notification.success('Sesión cerrada');
      },
      error: (err) => {
        this.procesando[s.idSesion] = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo cerrar la sesión.');
      },
    });
  }

  desbloquear(c: CuentaBloqueada): void {
    const texto = c.bloqueada
      ? `¿Desbloquear la cuenta de ${c.usuario || c.email}? Podrá volver a entrar de inmediato.`
      : `¿Reiniciar los intentos fallidos de ${c.usuario || c.email}?`;
    if (!confirm(texto)) return;
    this.procesando[c.idUsuario] = true;
    this.seguridad.desbloquear(c.idUsuario).subscribe({
      next: () => {
        this.procesando[c.idUsuario] = false;
        this.bloqueadas = this.bloqueadas.filter(x => x.idUsuario !== c.idUsuario);
        this.notification.success(c.bloqueada ? 'Cuenta desbloqueada' : 'Intentos reiniciados');
      },
      error: (err) => {
        this.procesando[c.idUsuario] = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo desbloquear la cuenta.');
      },
    });
  }
}
