import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface KardexDto {
  id:            number;
  idInventario:  number;
  nombreItem:    string;
  categoria:     string;
  fecha:         string;
  tipo:          'ENTRADA' | 'SALIDA' | 'AJUSTE';
  concepto:      string;
  cantidad:      number;
  valorUnitario: number;
  total:         number;
  saldoCantidad: number;
  fechaRegistro: string;
}

@Injectable({ providedIn: 'root' })
export class KardexService {
  private url = `${environment.url}api/Kardex`;
  constructor(private http: HttpClient) {}

  listar(idInventario?: number, tipo?: string): Observable<KardexDto[]> {
    let params = new HttpParams();
    if (idInventario) params = params.set('idInventario', idInventario);
    if (tipo)         params = params.set('tipo', tipo);
    return this.http.get<KardexDto[]>(this.url, { params });
  }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
