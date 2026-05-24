import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface BitacoraItem {
  id:          number;
  usuario:     string | null;
  accion:      string;
  fecha:       string;
  idAccion:    number;
  modulo:      string;
  idSucursal:  number | null;
  descripcion: string | null;
  total:       number;
}

export interface BitacoraFiltros {
  usuario?:    string;
  modulo?:     string;
  accion?:     string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina:      number;
  registros:   number;
}

@Injectable({ providedIn: 'root' })
export class BitacoraService {

  private url = `${environment.url}api/Bitacora`;

  constructor(private http: HttpClient) {}

  getBitacora(filtros: BitacoraFiltros): Observable<BitacoraItem[]> {
    let params = new HttpParams()
      .set('pagina',    filtros.pagina.toString())
      .set('registros', filtros.registros.toString());

    if (filtros.usuario)    params = params.set('usuario',    filtros.usuario);
    if (filtros.modulo)     params = params.set('modulo',     filtros.modulo);
    if (filtros.accion)     params = params.set('accion',     filtros.accion);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);

    return this.http.get<BitacoraItem[]>(this.url, { params });
  }
}
