import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface CamaraDto {
  deviceSerial: string;
  nombre: string;
}

export interface EzvizTokenDto {
  accessToken: string;
  expireTime: number;
  areaDomain: string;
}

@Injectable({ providedIn: 'root' })
export class CamarasService {

  private url = `${environment.url}api/Camaras`;

  constructor(private http: HttpClient) {}

  listarDispositivos(): Observable<CamaraDto[]> {
    return this.http.get<CamaraDto[]>(`${this.url}/dispositivos`);
  }

  obtenerToken(): Observable<EzvizTokenDto> {
    return this.http.get<EzvizTokenDto>(`${this.url}/token`);
  }
}
