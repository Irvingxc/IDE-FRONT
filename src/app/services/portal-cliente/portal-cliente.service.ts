import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface InvitacionResponse {
  token:         string;
  email:         string;
  nombreCliente: string;
}

export interface ValidarInvitacionResponse {
  token:         string;
  idCliente:     number;
  nombreCliente: string;
  email:         string;
  estado:        'VALIDO' | 'USADO' | 'EXPIRADO';
}

export interface ActivarCuentaRequest {
  token:    string;
  password: string;
}

export interface HijoDto {
  identidad:      string;
  nombreCompleto: string;
  grado:          string | null;
  estado:         string | null;
  foto:           string | null;
}

export interface PortalFacturaDto {
  idPago:       number;
  noFactura:    string;
  fecha:        string;
  total:        number;
  anulada:      string | null;
  identidad:    string;
  nombreAlumno: string;
}

export interface PortalCxcDto {
  id:           number;
  identidad:    string;
  nombreAlumno: string;
  anio:         number;
  mes:          number;
  tipoCuota:    string | null;
  fechaVence:   string | null;
  monto:        number;
  estado:       string;
  fechaPago:    string | null;
  producto:     string | null;
}

@Injectable({ providedIn: 'root' })
export class PortalClienteService {
  private base = `${environment.url}/api/PortalCliente`;

  constructor(private http: HttpClient) {}

  invitar(idCliente: number): Observable<InvitacionResponse> {
    return this.http.post<InvitacionResponse>(`${this.base}/invitar/${idCliente}`, {});
  }

  validarToken(token: string): Observable<ValidarInvitacionResponse> {
    return this.http.get<ValidarInvitacionResponse>(`${this.base}/validar/${token}`);
  }

  activarCuenta(request: ActivarCuentaRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/activar`, request);
  }

  misHijos(): Observable<HijoDto[]> {
    return this.http.get<HijoDto[]>(`${this.base}/mis-hijos`);
  }

  misFacturas(identidad?: string): Observable<PortalFacturaDto[]> {
    let params = new HttpParams();
    if (identidad) params = params.set('identidad', identidad);
    return this.http.get<PortalFacturaDto[]>(`${this.base}/mis-facturas`, { params });
  }

  miCXC(identidad?: string, anio?: number): Observable<PortalCxcDto[]> {
    let params = new HttpParams();
    if (identidad) params = params.set('identidad', identidad);
    if (anio)      params = params.set('anio', anio.toString());
    return this.http.get<PortalCxcDto[]>(`${this.base}/mi-cxc`, { params });
  }

  readonly MESES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  nombreMes(n: number): string { return this.MESES[n] ?? ''; }

  formatLps(v: number): string {
    return 'L. ' + v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
