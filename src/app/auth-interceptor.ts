import { HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { TokenService } from "./services/token/token.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router, private tokenService: TokenService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.tokenService.getToken();

    // Si el token existe y ya expiro, cerrar sesion antes de enviar la peticion
    if (token && this.tokenService.expirado(token)) {
      this.cerrarSesion();
      return throwError(() => new Error('Sesión expirada'));
    }

    // Sesion deslizante: cada peticion cuenta como actividad. Si al token le
    // queda poca vida se pide uno nuevo en segundo plano (por su propio cliente,
    // no vuelve a pasar por aqui).
    if (token) {
      this.tokenService.renovarSiHaceFalta();
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
    this.tokenService.clear();
    this.router.navigate(['/auth/login']);
  }
}
