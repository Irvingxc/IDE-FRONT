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

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  constructor(private http: HttpClient) {}

  guardarMatricula(dto: GuardarMatriculaDto): Observable<{ idCliente: number }> {
    return this.http.post<{ idCliente: number }>(`${environment.url}api/Matricula/guardar`, dto);
  }
}
