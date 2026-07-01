import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface EgresoDto {
  id:            number;
  fecha:         string;
  categoria:     string;
  concepto:      string;
  monto:         number;
  descripcion:   string | null;
  idUsuario:     string | null;
  fechaRegistro: string;
}

export interface GuardarEgresoDto {
  fecha:       string;
  categoria:   string;
  concepto:    string;
  monto:       number;
  descripcion?: string;
}

export const CATEGORIAS_EGRESO = [
  'Nómina',
  'Servicios básicos',
  'Mantenimiento',
  'Mobiliario',
  'Papelería y útiles',
  'Compras generales',
  'Otros',
];

@Injectable({ providedIn: 'root' })
export class EgresosService {
  private url = `${environment.url}api/Egresos`;
  constructor(private http: HttpClient) {}

  listar(anio: number, mes = 0, categoria?: string): Observable<EgresoDto[]> {
    let params = new HttpParams().set('anio', anio).set('mes', mes);
    if (categoria) params = params.set('categoria', categoria);
    return this.http.get<EgresoDto[]>(this.url, { params });
  }

  guardar(dto: GuardarEgresoDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
