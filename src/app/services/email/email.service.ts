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
  adjuntos?:     File[];
}

export interface EnviarCorreoMasivoResponse {
  enviados:      number;
  fallidos:      number;
  erroresEmails: string[];
}

/** Límites de adjuntos (los mismos que valida el backend). */
export const MAX_ADJUNTOS = 10;
export const MAX_BYTES_ADJUNTOS = 15 * 1024 * 1024;
export const EXTENSIONES_BLOQUEADAS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.ps1', '.jar', '.dll', '.lnk', '.reg', '.hta', '.cpl'
];

@Injectable({ providedIn: 'root' })
export class EmailService {
  private base = `${environment.url}api/Email`;

  constructor(private http: HttpClient) {}

  /** Envía el correo a uno o varios destinatarios (cada uno lo recibe por separado), con adjuntos opcionales. */
  enviarMasivo(request: EnviarCorreoMasivoRequest): Observable<EnviarCorreoMasivoResponse> {
    const form = new FormData();
    form.append('destinatarios', JSON.stringify(request.destinatarios));
    form.append('asunto', request.asunto);
    form.append('mensaje', request.mensaje);
    (request.adjuntos ?? []).forEach(a => form.append('adjuntos', a, a.name));
    return this.http.post<EnviarCorreoMasivoResponse>(`${this.base}/masivo`, form);
  }
}
