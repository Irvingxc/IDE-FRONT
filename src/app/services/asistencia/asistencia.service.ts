import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface AsistenciaReporteItem {
  codigoAlumno:   number;
  identidad:      string;
  nombreCompleto: string;
  grado:          string | null;
  seccion:        string | null;
  estado:         'Presente' | 'Ausente';
  horaMarca:      string | null;
  nombrePadre:    string | null;
  correoPadre:    string | null;
}

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private base = `${environment.url}api/Asistencia`;

  constructor(private http: HttpClient) {}

  getReporteDiario(fecha: Date, idGrado?: number | null): Observable<AsistenciaReporteItem[]> {
    let params = new HttpParams().set('fecha', fecha.toISOString().slice(0, 10));
    if (idGrado) params = params.set('idGrado', idGrado);
    return this.http.get<AsistenciaReporteItem[]>(`${this.base}/reporte`, { params });
  }
}
