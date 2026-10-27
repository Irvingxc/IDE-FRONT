import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface GuardarClienteDto {
  tipoIdentificacion: string;
  identidad:          string;
  primerNombre:       string;
  segundoNombre?:     string;
  primerApellido:     string;
  segundoApellido?:   string;
  nacionalidad:       string;
  sexo:               string;
  fechaNacimiento:    string | null;
  lugarNacimiento?:   string;
  departamento:       string;
  municipio:          string;
  direccion?:         string;
  telefono:           string;
  correoElectronico?: string;
  rtn?:               string;
}

export interface ClienteResponse {
  id: number;
  identidad: string;
  tipoIdentificacion: string;
  nombreCompleto: string;
  nombres: string;
  segundoNombre: string;
  apellidos: string;
  segundoApellido: string;
  sexo: string;
  fechaNacimiento: string;
  nacionalidad: string;
  lugarNacimiento: string;
  departamento: string;
  municipio: string;
  direccion: string;
  telefono: string;
  correoElectronico: string;
  rtn: string;
  fechaCreacion: string;
  tienePortal: boolean;
  /** Última invitación al portal (hora Honduras); null si nunca se invitó. */
  fechaUltimaInvitacion?: string | null;
  venceUltimaInvitacion?: string | null;
  totalRegistros: number;
  totalPaginas: number;
}

export interface ActualizarClienteDto {
  id:                  number;
  tipoIdentificacion?: string;
  identidad?:          string;
  primerNombre?:       string;
  segundoNombre?:      string;
  primerApellido?:     string;
  segundoApellido?:    string;
  nacionalidad?:       string;
  sexo?:               string;
  fechaNacimiento?:    string | null;
  lugarNacimiento?:    string;
  departamento?:       string;
  municipio?:          string;
  direccion?:          string;
  telefono?:           string;
  correoElectronico?:  string;
  rtn?:                string;
}

export const NIVELES_EDUCATIVOS = [
  'Sin estudios', 'Primaria', 'Secundaria / Bachillerato', 'Técnico', 'Universitario', 'Posgrado'
];

/** Cliente para la pantalla Correos, con cuántos alumnos activos o prematriculados tiene. */
export interface ContactoCorreo {
  id:                number;
  nombreCompleto:    string;
  identidad:         string | null;
  correoElectronico: string | null;
  telefono:          string | null;
  alumnosActivos:    number;
}

export interface FichaCliente {
  ocupacion:      string | null;
  nivelEducativo: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private http: HttpClient) {}

  getClientes(pagina: number, registrosPorPagina = 10, nombre = ''): Observable<ClienteResponse[]> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('registrosPorPagina', registrosPorPagina);

    if (nombre.trim()) {
      params = params.set('nombre', nombre.trim());
    }

    return this.http.get<ClienteResponse[]>(`${environment.url}api/Cliente/lista`, { params });
  }

  guardarCliente(dto: GuardarClienteDto): Observable<{ idCliente: number }> {
    return this.http.post<{ idCliente: number }>(`${environment.url}api/cliente/guardar`, dto);
  }

  actualizarCliente(dto: ActualizarClienteDto): Observable<{ filasAfectadas: number }> {
    return this.http.put<{ filasAfectadas: number }>(`${environment.url}api/cliente/${dto.id}`, dto);
  }

  getContactosCorreo(): Observable<ContactoCorreo[]> {
    return this.http.get<ContactoCorreo[]>(`${environment.url}api/cliente/contactos-correo`);
  }

  getFicha(id: number): Observable<FichaCliente> {
    return this.http.get<FichaCliente>(`${environment.url}api/cliente/${id}/ficha`);
  }

  guardarFicha(id: number, dto: FichaCliente): Observable<void> {
    return this.http.put<void>(`${environment.url}api/cliente/${id}/ficha`, dto);
  }

  buscarPorNombre(nombre: string): Observable<ClienteResponse[]> {
    const params = new HttpParams().set('nombre', nombre.trim());
    return this.http.get<ClienteResponse[]>(`${environment.url}api/Cliente/lista`, { params });
  }

  buscarPorIdentidad(identidad: string): Observable<ClienteResponse | null> {
    const params = new HttpParams().set('identidad', identidad.trim());
    return this.http.get<ClienteResponse | null>(`${environment.url}api/Cliente/buscar-identidad`, { params });
  }
}
