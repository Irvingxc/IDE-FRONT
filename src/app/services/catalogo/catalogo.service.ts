import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface GradoDto {
  idGrado:     number;
  gradoNombre: string;
  nivel:       string;
  orden:       number;
}

export interface GradoPrecioFlat {
  idGrado:        number;
  gradoNombre:    string;
  nivel:          string;
  orden:          number;
  idProducto:     number;
  productoNombre: string;
  precio:         number;
}

export interface ActualizarPrecioDto {
  idGrado:    number;
  idProducto: number;
  precio:     number;
}

export interface CrearProductoDto {
  nombre:      string;
  descripcion?: string;
}

export interface NivelIngles {
  id:     number;
  nombre: string;
  orden:  number;
  activo: boolean;
}

export interface GuardarNivelInglesDto {
  nombre: string;
  orden:  number;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {

  private url = `${environment.url}api/Catalogo`;

  constructor(private http: HttpClient) {}

  getGrados(): Observable<GradoDto[]> {
    return this.http.get<GradoDto[]>(`${this.url}/grados`);
  }

  getGradosConPrecios(): Observable<GradoPrecioFlat[]> {
    return this.http.get<GradoPrecioFlat[]>(`${this.url}/grados-precios`);
  }

  actualizarPrecio(dto: ActualizarPrecioDto): Observable<void> {
    return this.http.put<void>(`${this.url}/grados-precios`, dto);
  }

  crearProducto(dto: CrearProductoDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.url}/productos`, dto);
  }

  inactivarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/productos/${id}`);
  }

  generarCxcProducto(id: number, anio: number): Observable<{ registrosGenerados: number }> {
    return this.http.post<{ registrosGenerados: number }>(`${this.url}/productos/${id}/cxc?anio=${anio}`, null);
  }

  getNivelesIngles(soloActivos = true): Observable<NivelIngles[]> {
    return this.http.get<NivelIngles[]>(`${this.url}/niveles-ingles?soloActivos=${soloActivos}`);
  }

  crearNivelIngles(dto: GuardarNivelInglesDto): Observable<NivelIngles> {
    return this.http.post<NivelIngles>(`${this.url}/niveles-ingles`, dto);
  }

  actualizarNivelIngles(id: number, dto: GuardarNivelInglesDto): Observable<NivelIngles> {
    return this.http.put<NivelIngles>(`${this.url}/niveles-ingles/${id}`, dto);
  }

  inactivarNivelIngles(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/niveles-ingles/${id}`);
  }
}
