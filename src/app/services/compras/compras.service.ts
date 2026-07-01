import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface CompraResumenDto {
  id:            number;
  noFactura:     string | null;
  cai:           string | null;
  fecha:         string;
  proveedor:     string;
  subtotal:      number;
  porcentajeIsv: number;
  isv:           number;
  descuento:     number;
  total:         number;
  observaciones: string | null;
  estado:        string;
  cantidadItems: number;
}

export interface DetalleItemDto {
  id:            number;
  descripcion:   string;
  categoria:     string;
  cantidad:      number;
  valorUnitario: number;
  total:         number;
  idInventario:  number | null;
}

export interface CompraDetalleDto extends CompraResumenDto {
  idProveedor:  number | null;
  proveedorRTN: string | null;
  items:        DetalleItemDto[];
}

export interface CrearCompraItemDto {
  idInventario?: number;
  descripcion:   string;
  categoria:     string;
  cantidad:      number;
  valorUnitario: number;
}

export interface CrearCompraDto {
  idProveedor?:   number;
  noFactura?:     string;
  cai?:           string;
  fecha:          string;
  porcentajeIsv:  number;
  descuento:      number;
  observaciones?: string;
  items:          CrearCompraItemDto[];
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private url = `${environment.url}api/Compras`;
  constructor(private http: HttpClient) {}

  listar(anio: number, mes = 0, estado?: string): Observable<CompraResumenDto[]> {
    let params = new HttpParams().set('anio', anio).set('mes', mes);
    if (estado) params = params.set('estado', estado);
    return this.http.get<CompraResumenDto[]>(this.url, { params });
  }

  obtenerDetalle(id: number): Observable<CompraDetalleDto> {
    return this.http.get<CompraDetalleDto>(`${this.url}/${id}`);
  }

  crear(dto: CrearCompraDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url, dto);
  }

  anular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
