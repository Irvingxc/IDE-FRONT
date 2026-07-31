import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface DestinatarioCorreoDto {
  email:  string;
  nombre: string;
}

export interface EnviarCorreoMasivoRequest {
  destinatarios: DestinatarioCorreoDto[];
  asunto:        string;
  mensaje:       string;
}

export interface EnviarCorreoMasivoResponse {
  enviados:      number;
  fallidos:      number;
  erroresEmails: string[];
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private base = `${environment.url}api/Email`;

  constructor(private http: HttpClient) {}

  enviarMasivo(request: EnviarCorreoMasivoRequest): Observable<EnviarCorreoMasivoResponse> {
    return this.http.post<EnviarCorreoMasivoResponse>(`${this.base}/masivo`, request);
  }
}
