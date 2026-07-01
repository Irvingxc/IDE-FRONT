import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface SarItem {
  idSar:        number;
  cai:          string;
  rangoDel:     string;
  rangoAl:      string;
  fechaLim:     string;
  impuestoSar:  number;
  secuenciaSar: string;
  activo:       boolean;
}

export interface GuardarSarRequest {
  cai:         string;
  rangoDel:    string;
  rangoAl:     string;
  fechaLim:    string;
  impuestoSar: number;
}

@Injectable({ providedIn: 'root' })
export class SarService {
  private url = `${environment.url}api/Sar`;
  constructor(private http: HttpClient) {}

  listar(): Observable<SarItem[]> {
    return this.http.get<SarItem[]>(this.url);
  }

  guardar(dto: GuardarSarRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Formatea string raw → CAI con máscara: XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX */
  formatCai(value: string): string {
    const clean = value.replace(/[^A-Fa-f0-9]/g, '').toUpperCase().slice(0, 32);
    const groups = [6, 6, 6, 6, 6, 2];
    let result = '';
    let pos = 0;
    for (const len of groups) {
      if (pos >= clean.length) break;
      if (result) result += '-';
      result += clean.slice(pos, pos + len);
      pos += len;
    }
    return result;
  }

  /** Formatea string raw → Rango con máscara: 000-001-01-00000001 */
  formatRango(value: string): string {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    const groups = [3, 3, 2, 8];
    let result = '';
    let pos = 0;
    for (const len of groups) {
      if (pos >= clean.length) break;
      if (result) result += '-';
      result += clean.slice(pos, pos + len);
      pos += len;
    }
    return result;
  }

  caiCompleto(v: string): boolean {
    return v.replace(/[^A-Fa-f0-9]/g, '').length === 32;
  }

  rangoCompleto(v: string): boolean {
    return v.replace(/\D/g, '').length === 16;
  }
}
