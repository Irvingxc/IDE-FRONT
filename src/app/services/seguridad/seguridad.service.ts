import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface SesionActiva {
  idSesion:        string;
  idUsuario:       string;
  usuario:         string | null;
  email:           string | null;
  roles:           string | null;
  fechaInicio:     string;
  ultimaActividad: string;
  ip:              string | null;
  navegador:       string | null;
}

export interface CuentaBloqueada {
  idUsuario:        string;
  usuario:          string | null;
  email:            string | null;
  roles:            string | null;
  intentosFallidos: number;
  bloqueadoHasta:   string | null;
  bloqueada:        boolean;
}

export interface RechazoLimite {
  ip:       string | null;
  ruta:     string | null;
  politica: string | null;
  cantidad: number;
  primero:  string;
  ultimo:   string;
}

/** Sesiones activas, cuentas bloqueadas y rechazos del límite de solicitudes (solo Administrador). */
@Injectable({ providedIn: 'root' })
export class SeguridadService {
  private base = `${environment.url}api/Seguridad`;

  constructor(private http: HttpClient) {}

  sesiones(): Observable<SesionActiva[]> {
    return this.http.get<SesionActiva[]>(`${this.base}/sesiones`);
  }

  cerrarSesion(idSesion: string): Observable<void> {
    return this.http.post<void>(`${this.base}/sesiones/${idSesion}/cerrar`, {});
  }

  cuentasBloqueadas(): Observable<CuentaBloqueada[]> {
    return this.http.get<CuentaBloqueada[]>(`${this.base}/cuentas-bloqueadas`);
  }

  desbloquear(idUsuario: string): Observable<void> {
    return this.http.post<void>(`${this.base}/cuentas-bloqueadas/${encodeURIComponent(idUsuario)}/desbloquear`, {});
  }

  rechazos(horas = 24): Observable<RechazoLimite[]> {
    return this.http.get<RechazoLimite[]>(`${this.base}/rechazos`, { params: new HttpParams().set('horas', horas) });
  }
}
