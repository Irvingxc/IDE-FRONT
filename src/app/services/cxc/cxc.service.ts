import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface CxcResumen {
  identidad:        string;
  nombreCompleto:   string;
  gradoNombre:      string;
  nombreTutor:      string;
  cuotasPendientes: number;
  cuotasPagadas:    number;
  totalPendiente:   number;
  totalPagado:      number;
  totalDeudaAnio:   number;
}

export interface CxcDetalle {
  id:             number;
  identidad:      string;
  nombreCompleto: string;
  anio:           number;
  mes:            number;
  tipoCuota:      string;
  idProducto:     number;
  idGrado:        number | null;
  gradoNombre:    string | null;
  fechaVence:     string | null;
  monto:          number;
  descuento:      number;
  estado:         string;
  fechaPago:      string | null;
  observacion:    string | null;
  motivo:         string | null;
}

export interface CxcGeneracion {
  anio:            number;
  estado:          string;
  fechaReferencia: string | null;
  totalAlumnos:    number | null;
  totalCuotas:     number | null;
  fechaGeneracion: string | null;
}

export interface CxcAlumnoValidacion {
  identidad:           string;
  nombreCompleto:      string;
  estado:              string | null;
  grado:               string | null;
  mensualidades:       number;
  tieneMatricula:      boolean;
  tieneMatriculaAnual: boolean;
}

export interface CxcRevision {
  id:             number;
  identidad:      string;
  nombreCompleto: string;
  estado:         string | null;
  tipoCuota:      string;
  mes:            number;
  monto:          number;
  estadoCuota:    string;
}

@Injectable({ providedIn: 'root' })
export class CxcService {
  constructor(private http: HttpClient) {}

  getResumen(anio: number, nombre?: string, estado?: string): Observable<CxcResumen[]> {
    let params = new HttpParams().set('anio', anio);
    if (nombre?.trim()) params = params.set('nombre', nombre.trim());
    if (estado)         params = params.set('estado', estado);
    return this.http.get<CxcResumen[]>(`${environment.url}api/Cxc/resumen`, { params });
  }

  generarAnio(anio: number, fechaReferencia?: string, forzar = false): Observable<CxcAlumnoValidacion[]> {
    let params = new HttpParams().set('anio', anio).set('forzar', forzar);
    if (fechaReferencia) params = params.set('fechaReferencia', fechaReferencia);
    return this.http.post<CxcAlumnoValidacion[]>(`${environment.url}api/Cxc/generar`, null, { params });
  }

  recalcularAnio(anio: number, fechaReferencia?: string): Observable<CxcRevision[]> {
    let params = new HttpParams().set('anio', anio);
    if (fechaReferencia) params = params.set('fechaReferencia', fechaReferencia);
    return this.http.post<CxcRevision[]>(`${environment.url}api/Cxc/recalcular`, null, { params });
  }

  getAniosGenerados(): Observable<CxcGeneracion[]> {
    return this.http.get<CxcGeneracion[]>(`${environment.url}api/Cxc/anios-generados`);
  }

  getDetalle(identidad: string, anio?: number, soloPendientes = false): Observable<CxcDetalle[]> {
    let params = new HttpParams().set('soloPendientes', soloPendientes);
    if (anio) params = params.set('anio', anio);
    return this.http.get<CxcDetalle[]>(`${environment.url}api/Cxc/${identidad}/detalle`, { params });
  }

  cancelarCuota(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(
      `${environment.url}api/Cxc/${id}/cancelar`,
      JSON.stringify(motivo),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
