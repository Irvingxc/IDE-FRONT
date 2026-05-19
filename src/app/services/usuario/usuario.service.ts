import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { User } from '@app/models/backend/user';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.url}api/Usuario`);
  }

  registrar(usuario: Omit<User, 'id' | 'token'> & { password: string }): Observable<User> {
    return this.http.post<User>(`${environment.url}api/Usuario/registrar`, usuario);
  }
}
