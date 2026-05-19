import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";

function tokenExpirado(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');

    // Si el token existe y está expirado, cerrar sesión antes de enviar la petición
    if (token && tokenExpirado(token)) {
      this.cerrarSesion();
      return throwError(() => new Error('Sesión expirada'));
    }

    const request = token
      ? req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) })
      : req;

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.cerrarSesion();
        }
        return throwError(() => error);
      })
    );
  }

  private cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    this.router.navigate(['/auth/login']);
  }
}
