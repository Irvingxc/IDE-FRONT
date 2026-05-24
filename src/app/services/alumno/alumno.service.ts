import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface AlumnoResponse {
  codigo:             number;
  identidad:          string;
  tipoIdentificacion: string;
  nombreCompleto:     string;
  nombres:            string;
  segundoNombre:      string;
  apellidos:          string;
  segundoApellido:    string;
  idGrado:            number | null;
  grado:              string;
  foto:               string | null;
  estado:             string;
  valorMatricula:     number;
  valorMensualidad:   number;
  fechaMatricula:     string;
  sexo:               string;
  fechaNacimiento:    string;
  nacionalidad:       string;
  lugarNacimiento:    string;
  departamento:       string;
  municipio:          string;
  direccion:          string;
  telefono:           string;
  correoElectronico:  string;
  nombreTutor:        string;
  telefonoTutor:      string;
  descuento:          number | null;
  motivoDescuento:    string | null;
  totalRegistros:     number;
  totalPaginas:       number;
}

export interface GuardarAlumnoDto {
  identidad:          string;
  tipoIdentificacion?: string;
  primerNombre:       string;
  segundoNombre?:     string;
  primerApellido:     string;
  segundoApellido?:   string;
  cliente:            number;
  idGrado:            number;
  valorMatricula?:    number;
  valorMensualidad?:  number;
  fechaMatricula?:      string | null;
  fechaInicioClases?:   string | null;
  estado?:              string;
  nacionalidad?:      string;
  sexo?:              string;
  fechaNacimiento?:   string | null;
  lugarNacimiento?:   string;
  departamento?:      string;
  municipio?:         string;
  direccion?:         string;
  telefono?:          string;
  correoElectronico?: string;
  descuento?:         number;
  motivoDescuento?:   string;
  foto?:              string;
}

export interface ActualizarAlumnoDto {
  identidad:           string;
  tipoIdentificacion?: string;
  primerNombre?:       string;
  segundoNombre?:      string;
  primerApellido?:     string;
  segundoApellido?:    string;
  cliente?:            number;
  idGrado?:            number;
  valorMatricula?:     number;
  valorMensualidad?:   number;
  estado?:             string;
  nacionalidad?:       string;
  sexo?:               string;
  fechaNacimiento?:    string | null;
  lugarNacimiento?:    string;
  departamento?:       string;
  municipio?:          string;
  direccion?:          string;
  telefono?:           string;
  correoElectronico?:  string;
  foto?:               string;
}

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  constructor(private http: HttpClient) {}

  getAlumnos(
    pagina             = 1,
    registrosPorPagina = 10,
    nombre             = '',
    idGrado?:          number,
    estado             = '',
    idCliente?:        number
  ): Observable<AlumnoResponse[]> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('registrosPorPagina', registrosPorPagina);

    if (nombre.trim())     params = params.set('nombre',   nombre.trim());
    if (idGrado != null)   params = params.set('idGrado',  idGrado);
    if (estado.trim())     params = params.set('estado',   estado.trim());
    if (idCliente != null) params = params.set('idCliente', idCliente);

    return this.http.get<AlumnoResponse[]>(`${environment.url}api/Alumno/lista`, { params });
  }

  guardarAlumno(dto: GuardarAlumnoDto): Observable<{ codigo: number }> {
    return this.http.post<{ codigo: number }>(`${environment.url}api/alumno/guardar`, dto);
  }

  actualizarAlumno(dto: ActualizarAlumnoDto): Observable<{ filasAfectadas: number }> {
    return this.http.put<{ filasAfectadas: number }>(`${environment.url}api/alumno/${dto.identidad}`, dto);
  }

  cambiarEstado(identidad: string, estado: string): Observable<void> {
    return this.http.patch<void>(`${environment.url}api/alumno/${identidad}/estado`, { estado });
  }

  getFoto(identidad: string): Observable<{ foto: string | null }> {
    return this.http.get<{ foto: string | null }>(`${environment.url}api/alumno/${identidad}/foto`);
  }

  actualizarDescuento(identidad: string, descuento: number, motivoDescuento: string | null): Observable<void> {
    return this.http.patch<void>(`${environment.url}api/alumno/${identidad}/descuento`, { descuento, motivoDescuento });
  }
}
