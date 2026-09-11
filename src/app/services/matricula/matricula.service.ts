import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface GuardarMatriculaDto {
  // Cliente
  tipoIdentificacionCliente: string;
  identidadCliente:          string;
  primerNombreCliente:       string;
  segundoNombreCliente?:     string;
  primerApellidoCliente:     string;
  segundoApellidoCliente?:   string;
  nacionalidadCliente:       string;
  sexoCliente:               string;
  fechaNacimientoCliente:    string | null;
  lugarNacimientoCliente?:   string;
  departamentoCliente:       string;
  municipioCliente:          string;
  direccionCliente?:         string;
  telefonoCliente:           string;
  correoElectronicoCliente?: string;
  rtnCliente?:               string;

  // Alumno
  identidadAlumno:              string;
  tipoIdentificacionAlumno?:    string;
  primerNombreAlumno:           string;
  segundoNombreAlumno?:         string;
  primerApellidoAlumno:         string;
  segundoApellidoAlumno?:       string;
  idGrado:                      number;
  seccion?:                     string;
  valorMatricula?:              number;
  valorMensualidad?:            number;
  fechaInicioClases?:           string | null;
  nacionalidadAlumno?:          string;
  sexoAlumno?:                  string;
  fechaNacimientoAlumno?:       string | null;
  lugarNacimientoAlumno?:       string;
  departamentoAlumno?:          string;
  municipioAlumno?:             string;
  direccionAlumno?:             string;
  telefonoAlumno?:              string;
  correoElectronicoAlumno?:     string;
  descuento?:                   number;
  motivoDescuento?:             string;
  foto?:                        string;
}

// ── Promoción de grado / cierre de año lectivo ──

export interface PromocionAlumno {
  identidad:       string;
  codigo:          number | null;
  nombreCompleto:  string;
  estado:          string | null;
  idGradoActual:   number | null;
  gradoActual:     string | null;
  ordenActual:     number | null;
  seccion:         string | null;
  idNivelIngles:   number | null;
  nivelIngles:     string | null;
  estadoFinal:     string | null;
  promovido:       boolean | null;
  idGradoSugerido: number | null;
  gradoSugerido:   string | null;
  esUltimoGrado:   boolean;
  yaPromovido:     boolean;
  // Lo que realmente quedo guardado en el anio destino, si ya se proceso.
  idGradoReal:       number | null;
  gradoReal:         string | null;
  seccionReal:       string | null;
  idNivelInglesReal: number | null;
}

export interface PromoverAlumnoItem {
  identidad:            string;
  promovido:            boolean;
  egresa:               boolean;
  estadoFinal?:         string | null;
  idGradoDestino?:      number | null;
  seccion?:             string | null;
  idNivelInglesDestino?: number | null;
  valorMatricula?:      number | null;
  valorMensualidad?:    number | null;
}

export interface PromoverRequest {
  anioOrigen:  number;
  anioDestino: number;
  alumnos:     PromoverAlumnoItem[];
}

export interface PromocionResultado {
  promovidos: number;
  egresados:  number;
}

export interface PromocionEstado {
  anioOrigen:   number;
  anioDestino:  number;
  totalOrigen:  number;
  procesados:   number;
  totalDestino: number;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  constructor(private http: HttpClient) {}

  guardarMatricula(dto: GuardarMatriculaDto): Observable<{ idCliente: number }> {
    return this.http.post<{ idCliente: number }>(`${environment.url}api/Matricula/guardar`, dto);
  }

  listarPromocion(anioOrigen: number): Observable<PromocionAlumno[]> {
    return this.http.get<PromocionAlumno[]>(
      `${environment.url}api/Matricula/promocion?anioOrigen=${anioOrigen}`);
  }

  estadoPromocion(anioOrigen: number): Observable<PromocionEstado> {
    return this.http.get<PromocionEstado>(
      `${environment.url}api/Matricula/promocion/estado?anioOrigen=${anioOrigen}`);
  }

  promover(dto: PromoverRequest): Observable<PromocionResultado> {
    return this.http.post<PromocionResultado>(`${environment.url}api/Matricula/promover`, dto);
  }
}
