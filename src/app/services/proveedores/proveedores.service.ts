import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface ProveedorDto {
  id:               number;
  nombre:           string;
  rtn:              string | null;
  telefono:         string | null;
  correo:           string | null;
  contacto:         string | null;
  telefonoContacto: string | null;
  direccion:        string | null;
  categoria:        string | null;
  activo:           boolean;
  fechaRegistro:    string;
}

export interface GuardarProveedorDto {
  nombre:           string;
  rtn?:             string;
  telefono?:        string;
  correo?:          string;
  contacto?:        string;
  telefonoContacto?: string;
  direccion?:       string;
  categoria?:       string;
  activo:           boolean;
}

export const CATEGORIAS_PROVEEDOR = [
  'Papelería y útiles',
  'Tecnología',
  'Mobiliario',
  'Alimentos',
  'Mantenimiento',
  'Servicios',
  'Otros',
];

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private url = `${environment.url}api/Proveedores`;
  constructor(private http: HttpClient) {}

  listar(nombre?: string, categoria?: string, soloActivos = true): Observable<ProveedorDto[]> {
    let params = new HttpParams().set('soloActivos', soloActivos);
    if (nombre)    params = params.set('nombre', nombre);
    if (categoria) params = params.set('categoria', categoria);
    return this.http.get<ProveedorDto[]>(this.url, { params });
  }

  guardar(dto: GuardarProveedorDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.url, dto);
  }

  actualizar(id: number, dto: GuardarProveedorDto): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, dto);
  }
}
