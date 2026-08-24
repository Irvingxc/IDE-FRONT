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

export interface EmpleadoReporteItem {
  empleadoId:     number;
  codigoInterno:  string;
  nombreCompleto: string | null;
  departamento:   string | null;
  estado:         'Presente' | 'Ausente';
  horaPrimera:    string | null;
  horaUltima:     string | null;
  duracion:       number | null;
  cantidadMarcas: number | null;
}

export interface ZlinkSyncResultDto {
  totalRecibidos: number;
  alumnos:        number;
  empleados:      number;
  omitidos:       number;
}

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private base = `${environment.url}api/Asistencia`;

  constructor(private http: HttpClient) {}

  // No usar fecha.toISOString() para esto: convierte a UTC y puede saltar
  // al dia siguiente/anterior segun la hora local, aunque el datepicker
  // muestre la fecha correcta (el datepicker formatea con componentes
  // locales, no UTC). Aqui hacemos lo mismo para mandar la fecha que el
  // usuario realmente ve en pantalla.
  private formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const d = fecha.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getReporteDiario(fecha: Date, idGrado?: number | null): Observable<AsistenciaReporteItem[]> {
    let params = new HttpParams().set('fecha', this.formatearFecha(fecha));
    if (idGrado) params = params.set('idGrado', idGrado);
    return this.http.get<AsistenciaReporteItem[]>(`${this.base}/reporte`, { params });
  }

  getReporteEmpleados(fecha: Date): Observable<EmpleadoReporteItem[]> {
    const params = new HttpParams().set('fecha', this.formatearFecha(fecha));
    return this.http.get<EmpleadoReporteItem[]>(`${this.base}/empleados/reporte`, { params });
  }

  sincronizarZlink(): Observable<ZlinkSyncResultDto> {
    return this.http.post<ZlinkSyncResultDto>(`${this.base}/zlink/sincronizar`, {});
  }
}
