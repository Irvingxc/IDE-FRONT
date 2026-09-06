import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '@src/environments/environment';

const TOKEN_KEY = 'token';
const USER_KEY  = 'user_session';

// El backend emite tokens de 1 hora. Cuando al token vigente le quedan menos de
// estos minutos de vida, y el usuario sigue haciendo peticiones (= sigue usando
// el sitio), se pide uno nuevo para mantener la sesion viva ("sesion deslizante").
const UMBRAL_RENOVACION_MIN = 20;

@Injectable({ providedIn: 'root' })
export class TokenService {

  /** Cliente HTTP sin interceptores: evita recursion al pedir el refresh. */
  private readonly http: HttpClient;
  private renovando = false;

  /** Emite el token vigente cada vez que cambia: login, refresh o logout (null). */
  readonly token$ = new BehaviorSubject<string | null>(this.getToken());

  constructor(backend: HttpBackend) {
    this.http = new HttpClient(backend);

    // Si otra pestaña renueva o cierra la sesion, reflejarlo aqui.
    window.addEventListener('storage', (e) => {
      if (e.key === TOKEN_KEY) this.token$.next(e.newValue);
    });
  }

  getToken(): string | null {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }

  /** Guarda un token nuevo (y opcionalmente el usuario asociado) y lo difunde. */
  setToken(token: string, user?: unknown): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (user !== undefined) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* localStorage no disponible */ }
    this.token$.next(token);
  }

  /** Borra la sesion del almacenamiento local y difunde el cierre. */
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* localStorage no disponible */ }
    this.token$.next(null);
  }

  /** Milisegundos que faltan para que expire el token (0 si no hay o es ilegible). */
  msParaExpirar(token: string | null = this.getToken()): number {
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return 0;
      return payload.exp * 1000 - Date.now();
    } catch { return 0; }
  }

  expirado(token: string | null = this.getToken()): boolean {
    return !!token && this.msParaExpirar(token) <= 0;
  }

  /**
   * Si al token vigente le queda poca vida, pide uno nuevo al backend en segundo
   * plano y lo guarda. Se invoca desde el interceptor en cada peticion, de modo
   * que mientras el usuario use el sitio la sesion nunca llega a expirar.
   */
  renovarSiHaceFalta(): void {
    if (this.renovando) return;

    const token = this.getToken();
    if (!token) return;

    const restante = this.msParaExpirar(token);
    if (restante <= 0) return;                                 // ya expiro: lo maneja el logout
    if (restante > UMBRAL_RENOVACION_MIN * 60 * 1000) return;  // todavia tiene cuerda

    this.renovando = true;
    this.http.get<{ token?: string }>(
      `${environment.url}api/Usuario/refresh`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (user) => {
        if (user?.token) this.setToken(user.token, user);
        this.renovando = false;
      },
      error: () => { this.renovando = false; }
    });
  }
}
