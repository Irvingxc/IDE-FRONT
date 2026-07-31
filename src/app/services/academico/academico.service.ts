import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface PeriodoResponse {
  id:            number;
  nombre:        string;
  fechaDesde:    string;
  fechaHasta:    string;
  anioLectivo:   number;
  activo:        boolean;
  fechaCreacion: string;
}

export interface GuardarPeriodoDto {
  nombre:      string;
  fechaDesde:  string;
  fechaHasta:  string;
  anioLectivo: number;
}

export interface ClaseResponse {
  id:            number;
  nombre:        string;
  idGrado:       number;
  gradoNombre:   string;
  idMaestro:     string | null;
  maestroNombre: string | null;
  anioLectivo:   number;
  activo:        boolean;
  fechaCreacion: string;
}

export interface GuardarClaseDto {
  nombre:      string;
  idGrado:     number;
  idMaestro:   string | null;
  anioLectivo: number;
}

export interface SemanaResponse {
  id:            number;
  idPeriodo:     number;
  numeroSemana:  number;
  fechaDesde:    string;
  fechaHasta:    string;
  activo:        boolean;
  fechaCreacion: string;
}

export interface EvaluacionResponse {
  id:            number;
  idSemana:      number;
  idClase:       number;
  nombre:        string;
  activo:        boolean;
  fechaCreacion: string;
}

export interface GuardarEvaluacionDto {
  idSemana: number;
  idClase:  number;
  nombre:   string;
}

export interface NotaAlumno {
  idAlumno:       string;
  nombreCompleto: string;
  nota:           number | null;
}

export interface GuardarNotaDto {
  idAlumno: string;
  nota:     number;
}

@Injectable({ providedIn: 'root' })
export class AcademicoService {
  private base = `${environment.url}api/Academico`;

  constructor(private http: HttpClient) {}

  listarPeriodos(anioLectivo?: number, soloActivos = true): Observable<PeriodoResponse[]> {
    let params = new HttpParams().set('soloActivos', soloActivos);
    if (anioLectivo) params = params.set('anioLectivo', anioLectivo);
    return this.http.get<PeriodoResponse[]>(`${this.base}/periodos`, { params });
  }

  crearPeriodo(dto: GuardarPeriodoDto): Observable<PeriodoResponse> {
    return this.http.post<PeriodoResponse>(`${this.base}/periodos`, dto);
  }

  actualizarPeriodo(id: number, dto: GuardarPeriodoDto): Observable<PeriodoResponse> {
    return this.http.put<PeriodoResponse>(`${this.base}/periodos/${id}`, dto);
  }

  inactivarPeriodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/periodos/${id}`);
  }

  listarClases(anioLectivo?: number, soloActivos = true): Observable<ClaseResponse[]> {
    let params = new HttpParams().set('soloActivos', soloActivos);
    if (anioLectivo) params = params.set('anioLectivo', anioLectivo);
    return this.http.get<ClaseResponse[]>(`${this.base}/clases`, { params });
  }

  crearClase(dto: GuardarClaseDto): Observable<ClaseResponse> {
    return this.http.post<ClaseResponse>(`${this.base}/clases`, dto);
  }

  actualizarClase(id: number, dto: GuardarClaseDto): Observable<ClaseResponse> {
    return this.http.put<ClaseResponse>(`${this.base}/clases/${id}`, dto);
  }

  inactivarClase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/clases/${id}`);
  }

  listarSemanas(idPeriodo: number): Observable<SemanaResponse[]> {
    const params = new HttpParams().set('idPeriodo', idPeriodo);
    return this.http.get<SemanaResponse[]>(`${this.base}/semanas`, { params });
  }

  listarEvaluaciones(idClase: number, idSemana: number): Observable<EvaluacionResponse[]> {
    const params = new HttpParams().set('idClase', idClase).set('idSemana', idSemana);
    return this.http.get<EvaluacionResponse[]>(`${this.base}/evaluaciones`, { params });
  }

  crearEvaluacion(dto: GuardarEvaluacionDto): Observable<EvaluacionResponse> {
    return this.http.post<EvaluacionResponse>(`${this.base}/evaluaciones`, dto);
  }

  inactivarEvaluacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/evaluaciones/${id}`);
  }

  listarNotas(idEvaluacion: number): Observable<NotaAlumno[]> {
    return this.http.get<NotaAlumno[]>(`${this.base}/evaluaciones/${idEvaluacion}/notas`);
  }

  guardarNotas(idEvaluacion: number, notas: GuardarNotaDto[]): Observable<void> {
    return this.http.put<void>(`${this.base}/evaluaciones/${idEvaluacion}/notas`, notas);
  }
}
