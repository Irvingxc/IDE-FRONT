import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export type EstadoPrueba = 'Pendiente' | 'Vencida' | 'En curso' | 'Terminada' | 'Anulada';

export interface PruebaAspirante {
  id:             number;
  codigo:         string;
  claveTipo:      string;
  tipoNombre:     string;
  numPreguntas:   number;
  minutosLimite:  number;
  nombre:         string;
  sexo:           'M' | 'F';
  edadAnios:      number | null;
  edadMeses:      number | null;
  lugar:          string | null;
  ciudad:         string | null;
  puesto:         string | null;
  estado:         EstadoPrueba;
  fechaCreacion:  string;
  fechaVence:     string;
  fechaInicio:    string | null;
  fechaLimite:    string | null;
  fechaFin:       string | null;
  motivoFin:      string | null;
  aciertos:       number | null;
  errores:        number | null;
  omitidas:       number | null;
  percentil:      string | null;
  diagnostico:    string | null;
  salidasPestana: number;
  respondidas:    number;
  usuarioCreo:    string | null;
}

export interface PruebaAspiranteRespuesta {
  numero:    number;
  opciones:  string;
  correcta:  string;
  respuesta: string | null;
}

export interface PruebaAspiranteDetalle {
  prueba:     PruebaAspirante;
  respuestas: PruebaAspiranteRespuesta[];
}

export interface CrearPruebaAspirante {
  nombre:    string;
  sexo:      'M' | 'F';
  edadAnios: number | null;
  edadMeses: number | null;
  lugar:     string | null;
  ciudad:    string | null;
  puesto:    string | null;
}

/** Lo que ve el aspirante: sin clave ni resultado. */
export interface PruebaPublica {
  codigo:            string;
  nombre:            string;
  puesto:            string | null;
  tipoNombre:        string;
  numPreguntas:      number;
  minutosLimite:     number;
  estado:            EstadoPrueba;
  segundosRestantes: number | null;
  preguntas:         { numero: number; opciones: string; respuesta: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class PruebasAspirantesService {
  private readonly base = `${environment.url}api/PruebasAspirantes`;

  constructor(private http: HttpClient) {}

  // ----- Administracion (permiso PRUEBAS_ASPIRANTES) -----

  listar(desde: string, hasta: string): Observable<PruebaAspirante[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<PruebaAspirante[]>(this.base, { params });
  }

  detalle(id: number): Observable<PruebaAspiranteDetalle> {
    return this.http.get<PruebaAspiranteDetalle>(`${this.base}/${id}`);
  }

  crear(dto: CrearPruebaAspirante): Observable<PruebaAspiranteDetalle> {
    return this.http.post<PruebaAspiranteDetalle>(this.base, dto);
  }

  anular(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/anular`, {});
  }

  // ----- Hoja de respuestas del aspirante (sin sesion) -----

  obtenerPublica(codigo: string): Observable<PruebaPublica> {
    return this.http.get<PruebaPublica>(`${this.base}/publica/${encodeURIComponent(codigo)}`);
  }

  iniciarPublica(codigo: string): Observable<PruebaPublica> {
    return this.http.post<PruebaPublica>(`${this.base}/publica/${encodeURIComponent(codigo)}/iniciar`, {});
  }

  responderPublica(codigo: string, numero: number, respuesta: string | null): Observable<void> {
    return this.http.put<void>(`${this.base}/publica/${encodeURIComponent(codigo)}/respuesta`, { numero, respuesta });
  }

  registrarSalidaPublica(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.base}/publica/${encodeURIComponent(codigo)}/salida`, {});
  }

  terminarPublica(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.base}/publica/${encodeURIComponent(codigo)}/terminar`, {});
  }
}

/** Codigo de 8 caracteres mostrado como XXXX-XXXX. */
export function formatoCodigo(codigo: string): string {
  return codigo?.length === 8 ? `${codigo.slice(0, 4)}-${codigo.slice(4)}` : codigo;
}
