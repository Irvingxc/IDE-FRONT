import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface DashboardHomeResponse {
  estudiantesActivos: number;
  facturasEmitidas: number;
  mesFacturas: string;
  pagosPendientes: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getHome(): Observable<DashboardHomeResponse | null> {
    return this.http.get<DashboardHomeResponse | null>(`${environment.url}api/dashboard/home`);
  }
}
