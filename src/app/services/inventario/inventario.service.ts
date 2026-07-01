import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface InventarioDto {
  id:               number;
  nombre:           string;
  categoria:        string;
  cantidad:         number;
  valorUnitario:    number;
  valorTotal:       number;
  fechaAdquisicion: string;
  estado:           string;
  descripcion:      string | null;
  fechaRegistro:    string;
}

export interface GuardarInventarioDto {
  nombre:           string;
  categoria:        string;
  cantidad:         number;
  valorUnitario:    number;
  fechaAdquisicion: string;
  descripcion?:     string;
}

export const CATEGORIAS_INVENTARIO = [
  'Mobiliario',
  'Equipo de cómputo',
  'Material didáctico',
  'Herramientas',
  'Electrónica',
  'Vehículos',
  'Otros',
];

export const ESTADOS_INVENTARIO = ['Activo', 'En reparación', 'Dado de baja'];

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private url = `${environment.url}api/Inventario`;
  constructor(private http: HttpClient) {}

  listar(categoria?: string, estado?: string): Observable<InventarioDto[]> {
    let params = new HttpParams();
    if (categoria) params = params.set('categoria', categoria);
    if (estado)    params = params.set('estado', estado);
    return this.http.get<InventarioDto[]>(this.url, { params });
  }

  guardar(dto: GuardarInventarioDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url, dto);
  }

  actualizarEstado(id: number, estado: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/estado`, JSON.stringify(estado), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
