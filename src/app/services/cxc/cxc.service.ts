import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface CxcResumen {
  identidad:        string;
  nombreCompleto:   string;
  gradoNombre:      string;
  cuotasPendientes: number;
  cuotasPagadas:    number;
  totalPendiente:   number;
  totalPagado:      number;
}

export interface CxcDetalle {
  id:             number;
  identidad:      string;
  nombreCompleto: string;
  anio:           number;
  mes:            number;
  tipoCuota:      string;
  idProducto:     number;
  fechaVence:     string | null;
  monto:          number;
  estado:         string;
  fechaPago:      string | null;
  observacion:    string | null;
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

  generarAnio(anio: number): Observable<void> {
    return this.http.post<void>(`${environment.url}api/Cxc/generar?anio=${anio}`, null);
  }

  getAniosGenerados(): Observable<number[]> {
    return this.http.get<number[]>(`${environment.url}api/Cxc/anios-generados`);
  }

  getDetalle(identidad: string, anio?: number, soloPendientes = false): Observable<CxcDetalle[]> {
    let params = new HttpParams().set('soloPendientes', soloPendientes);
    if (anio) params = params.set('anio', anio);
    return this.http.get<CxcDetalle[]>(`${environment.url}api/Cxc/${identidad}/detalle`, { params });
  }
}
