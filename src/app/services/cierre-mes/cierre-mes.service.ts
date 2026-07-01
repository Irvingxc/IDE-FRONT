import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface CierreMesDto {
  id:            number;
  anio:          number;
  mes:           number;
  fechaCierre:   string;
  totalIngresos: number;
  totalEgresos:  number;
  resultado:     number;
  observaciones: string | null;
}

export interface ResumenCierreMesDto {
  totalIngresos: number;
  totalEgresos:  number;
  resultado:     number;
  yaCerrado:     boolean;
}

export interface CerrarMesRequestDto {
  anio:          number;
  mes:           number;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class CierreMesService {
  private url = `${environment.url}api/CierreMes`;
  constructor(private http: HttpClient) {}

  listar(): Observable<CierreMesDto[]> {
    return this.http.get<CierreMesDto[]>(this.url);
  }

  obtenerResumen(anio: number, mes: number): Observable<ResumenCierreMesDto> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ResumenCierreMesDto>(`${this.url}/resumen`, { params });
  }

  cerrarMes(dto: CerrarMesRequestDto): Observable<void> {
    return this.http.post<void>(this.url, dto);
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  nombreMes(m: number): string {
    return ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m] ?? '';
  }
}
