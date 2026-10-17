import { Injectable } from '@angular/core';
import { NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Detecta despliegues nuevos sin que el usuario tenga que limpiar caché.
 *
 * Cloudflare Pages ya sirve el index.html sin caché, pero una pestaña abierta antes del
 * despliegue sigue con el main.js viejo: al entrar a un módulo que aún no había cargado
 * pide un .js que ya no existe, Cloudflare responde con el index.html y el módulo falla.
 *
 * - Cada 5 minutos y al volver a la pestaña revisa si el index.html publicado apunta a otro
 *   main.<hash>.js. Si cambió, la siguiente navegación carga la página completa (versión nueva).
 * - Si aun así falla la carga de un módulo (archivo viejo), recarga en la ruta pedida.
 */
@Injectable({ providedIn: 'root' })
export class VersionService {

  private static readonly CADA_MS = 5 * 60 * 1000;
  private static readonly CLAVE_RECARGA = 'ide_recarga_version';

  private readonly mainActual = VersionService.mainDe(document.documentElement.innerHTML);
  private hayVersionNueva = false;
  private ultimaRevision = 0;

  constructor(private router: Router) {}

  iniciar(): void {
    // Sin hash (ng serve) no hay versiones que comparar.
    if (!this.mainActual) return;

    setInterval(() => this.revisar(), VersionService.CADA_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.revisar();
    });

    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(e => {
      if (!this.hayVersionNueva) return;
      // Carga completa en la ruta a la que iba: trae el index.html y los .js nuevos.
      this.recargar((e as NavigationStart).url);
    });

    this.router.events.pipe(filter(e => e instanceof NavigationError)).subscribe(e => {
      const err = (e as NavigationError).error;
      const msg = String(err?.message ?? err ?? '');
      if (/ChunkLoadError|Loading chunk|dynamically imported module|Unexpected token '<'/i.test(msg)) {
        this.recargar((e as NavigationError).url);
      }
    });
  }

  private revisar(): void {
    const ahora = Date.now();
    if (this.hayVersionNueva || ahora - this.ultimaRevision < 30_000) return;
    this.ultimaRevision = ahora;

    fetch('/?v=' + ahora, { cache: 'no-store' })
      .then(r => (r.ok ? r.text() : ''))
      .then(html => {
        const publicado = VersionService.mainDe(html);
        if (publicado && publicado !== this.mainActual) this.hayVersionNueva = true;
      })
      .catch(() => { /* sin red: se revisa en la próxima vuelta */ });
  }

  /** Recarga una sola vez cada 20 s (evita ciclos si el despliegue aún se está propagando). */
  private recargar(url: string): void {
    try {
      const ultima = Number(sessionStorage.getItem(VersionService.CLAVE_RECARGA) ?? 0);
      if (Date.now() - ultima < 20_000) return;
      sessionStorage.setItem(VersionService.CLAVE_RECARGA, String(Date.now()));
    } catch { /* sessionStorage no disponible: recarga igual */ }
    window.location.assign(url);
  }

  /** Nombre del main.<hash>.js que referencia un index.html. */
  private static mainDe(html: string): string | null {
    return html.match(/main\.[a-f0-9]{8,}\.js/)?.[0] ?? null;
  }
}
