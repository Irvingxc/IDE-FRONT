import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface PeriodoResponse {
  id:            number;
  nombre:        string;
  fechaDesde:    string;
  fechaHasta:    string;
  anioLectivo:   number;
  activo:        boolean;
  bloqueado:     boolean;
  fechaCreacion: string;
}

export interface GuardarPeriodoDto {
  nombre:      string;
  fechaDesde:  string;
  fechaHasta:  string;
  anioLectivo: number;
}

export interface ClaseResponse {
  id:                number;
  nombre:            string;
  idGrado:           number | null;
  gradoNombre:       string | null;
  idNivelIngles:     number | null;
  nivelInglesNombre: string | null;
  seccion:           string;
  idMaestro:         string | null;
  maestroNombre:     string | null;
  anioLectivo:       number;
  activo:            boolean;
  fechaCreacion:     string;
}

export interface GuardarClaseDto {
  nombre:        string;
  idGrado:       number | null;
  idNivelIngles: number | null;
  seccion:       string;
  idMaestro:     string | null;
  anioLectivo:   number;
}

export interface Actividad {
  id:         number;
  nombre:     string;
  porcentaje: number;
  orden:      number;
}

export interface ConceptoPrincipal {
  id:          number;
  nombre:      string;
  orden:       number;
  actividades: Actividad[];
}

export interface GuardarActividadItem {
  id:         number | null;
  nombre:     string;
  porcentaje: number;
  orden:      number;
}

export interface GuardarConceptoPrincipalItem {
  id:          number | null;
  nombre:      string;
  orden:       number;
  actividades: GuardarActividadItem[];
}

export interface ActividadNombreClaseItem {
  idActividad: number;
  nombre:      string;
}

export interface AlumnoNotaActividad {
  idAlumno:       string;
  codigo:         number;
  nombreCompleto: string;
  notas: { [idActividad: number]: number | null };
}

export interface GuardarNotaActividadItem {
  idAlumno:    string;
  idActividad: number;
  nota:        number | null;
}

export interface CambioNotaImportada {
  idAlumno:        string;
  alumnoNombre:    string;
  idActividad:     number;
  actividadNombre: string;
  notaAnterior:    number | null;
  notaNueva:       number;
}

export interface ErrorImportacionNotas {
  fila:    number | null;
  mensaje: string;
}

export interface PrevisualizacionImportacionNotas {
  alumnosLeidos:  number;
  notasSinCambio: number;
  cambios:        CambioNotaImportada[];
  errores:        ErrorImportacionNotas[];
}

export interface AlumnoGrado {
  identidad:      string;
  nombreCompleto: string;
  seccion:        string | null;
  nivelIngles:    string | null;
}

export interface ReporteNotaActividad {
  id:         number;
  nombre:     string;
  porcentaje: number;
  orden:      number;
  nota:       number | null;
}

export interface ReporteNotaConcepto {
  id:          number;
  nombre:      string;
  orden:       number;
  actividades: ReporteNotaActividad[];
}

export interface ReporteNotaClase {
  idClase:       number;
  claseNombre:   string;
  maestroNombre: string | null;
  conceptos:     ReporteNotaConcepto[];
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

  bloquearPeriodo(id: number, bloqueado: boolean): Observable<PeriodoResponse> {
    return this.http.patch<PeriodoResponse>(`${this.base}/periodos/${id}/bloqueo`, bloqueado);
  }

  listarClases(anioLectivo?: number, soloActivos = true): Observable<ClaseResponse[]> {
    let params = new HttpParams().set('soloActivos', soloActivos);
    if (anioLectivo) params = params.set('anioLectivo', anioLectivo);
    return this.http.get<ClaseResponse[]>(`${this.base}/clases`, { params });
  }

  private paramsGrupo(idGrado: number | null, idNivelIngles: number | null): HttpParams {
    let params = new HttpParams();
    if (idGrado != null) params = params.set('idGrado', idGrado);
    if (idNivelIngles != null) params = params.set('idNivelIngles', idNivelIngles);
    return params;
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

  listarConceptosConActividades(idGrado: number | null, idNivelIngles: number | null): Observable<ConceptoPrincipal[]> {
    return this.http.get<ConceptoPrincipal[]>(`${this.base}/estructura-grado`, { params: this.paramsGrupo(idGrado, idNivelIngles) });
  }

  guardarConceptosConActividades(idGrado: number | null, idNivelIngles: number | null, arbol: GuardarConceptoPrincipalItem[]): Observable<ConceptoPrincipal[]> {
    return this.http.put<ConceptoPrincipal[]>(`${this.base}/estructura-grado`, arbol, { params: this.paramsGrupo(idGrado, idNivelIngles) });
  }

  listarEstructuraClase(idClase: number, idPeriodo: number): Observable<ConceptoPrincipal[]> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    return this.http.get<ConceptoPrincipal[]>(`${this.base}/estructura-clase`, { params });
  }

  guardarActividadesNombreClase(idClase: number, idPeriodo: number, nombres: ActividadNombreClaseItem[]): Observable<void> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    return this.http.put<void>(`${this.base}/actividades-nombre-clase`, nombres, { params });
  }

  listarAlumnosNotasActividad(idClase: number, idPeriodo: number): Observable<AlumnoNotaActividad[]> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    return this.http.get<AlumnoNotaActividad[]>(`${this.base}/notas-actividad`, { params });
  }

  guardarNotasActividad(idClase: number, idPeriodo: number, notas: GuardarNotaActividadItem[]): Observable<void> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    return this.http.put<void>(`${this.base}/notas-actividad`, notas, { params });
  }

  descargarPlantillaNotas(idClase: number, idPeriodo: number): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    return this.http.get(`${this.base}/notas-actividad/plantilla`, { params, responseType: 'blob', observe: 'response' });
  }

  previsualizarImportacionNotas(idClase: number, idPeriodo: number, archivo: File): Observable<PrevisualizacionImportacionNotas> {
    const params = new HttpParams().set('idClase', idClase).set('idPeriodo', idPeriodo);
    const form = new FormData();
    form.append('archivo', archivo, archivo.name);
    return this.http.post<PrevisualizacionImportacionNotas>(`${this.base}/notas-actividad/importar`, form, { params });
  }

  // ── Reporte de notas por alumno (modulo Reportes) ──

  alumnosPorGrado(idGrado: number, anioLectivo?: number): Observable<AlumnoGrado[]> {
    let params = new HttpParams().set('idGrado', idGrado);
    if (anioLectivo != null) params = params.set('anioLectivo', anioLectivo);
    return this.http.get<AlumnoGrado[]>(`${this.base}/alumnos-por-grado`, { params });
  }

  reporteNotasAlumno(identidad: string, idPeriodo: number): Observable<ReporteNotaClase[]> {
    const params = new HttpParams().set('identidad', identidad).set('idPeriodo', idPeriodo);
    return this.http.get<ReporteNotaClase[]>(`${this.base}/reporte-notas`, { params });
  }

  historialNotasAlumno(idClase: number, idPeriodo: number, idAlumno: string): Observable<HistorialNota[]> {
    const params = new HttpParams()
      .set('idClase', idClase)
      .set('idPeriodo', idPeriodo)
      .set('idAlumno', idAlumno);
    return this.http.get<HistorialNota[]>(`${this.base}/historial-notas`, { params });
  }
}

export interface HistorialNota {
  id:              number;
  idActividad:     number;
  actividadNombre: string;
  conceptoNombre:  string | null;
  notaAnterior:    number | null;
  notaNueva:       number | null;
  accion:          'ALTA' | 'MODIFICACION';
  fecha:           string;
  usuarioId:       string | null;
  usuarioNombre:   string | null;
}
