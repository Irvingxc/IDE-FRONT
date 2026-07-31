import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { User } from '@app/models/backend/user';

export interface ModuloDto {
  id:           number;
  clave:        string;
  nombre:       string;
  icono:        string;
  seleccionado: boolean;
}

export interface UsuarioLista {
  id:         string;
  nombre:     string;
  apellido:   string;
  username:   string;
  email:      string;
  telefono?:  string;
  sucursalId?: number;
  aula?:      string;
  rol?:       string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<UsuarioLista[]> {
    return this.http.get<UsuarioLista[]>(`${environment.url}api/Usuario/lista`);
  }

  registrar(usuario: Omit<User, 'id' | 'token'> & { password: string }): Observable<User> {
    return this.http.post<User>(`${environment.url}api/Usuario/registrar`, usuario);
  }

  editar(id: string, datos: Partial<UsuarioLista>): Observable<UsuarioLista> {
    return this.http.put<UsuarioLista>(`${environment.url}api/Usuario/${id}`, datos);
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.put<void>(`${environment.url}api/Usuario/cambiar-password`, { passwordActual, passwordNueva });
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.url}api/Usuario/roles`);
  }

  crearRol(nombre: string): Observable<string> {
    return this.http.post<string>(`${environment.url}api/Usuario/roles`, nombre);
  }

  renombrarRol(nombreActual: string, nombreNuevo: string): Observable<string> {
    return this.http.put<string>(`${environment.url}api/Usuario/roles/${encodeURIComponent(nombreActual)}`, nombreNuevo);
  }

  eliminarRol(nombre: string): Observable<void> {
    return this.http.delete<void>(`${environment.url}api/Usuario/roles/${encodeURIComponent(nombre)}`);
  }

  getModulosDeRol(rolNombre: string): Observable<ModuloDto[]> {
    return this.http.get<ModuloDto[]>(`${environment.url}api/Usuario/roles/${encodeURIComponent(rolNombre)}/modulos`);
  }

  actualizarModulosDeRol(rolNombre: string, moduloIds: number[]): Observable<void> {
    return this.http.put<void>(`${environment.url}api/Usuario/roles/${encodeURIComponent(rolNombre)}/modulos`, moduloIds);
  }

  getSucursales(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${environment.url}api/Usuario/sucursales`);
  }

  seleccionarSucursal(sucursalId: number): Observable<User> {
    return this.http.post<User>(`${environment.url}api/Usuario/seleccionar-sucursal`, sucursalId);
  }
}
