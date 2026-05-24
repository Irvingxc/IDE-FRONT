import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { NotificationService } from "@app/services";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { environment } from "@src/environments/environment";
import { Observable, of } from "rxjs";
import { catchError, switchMap, tap, map } from "rxjs/operators";
import * as fromActions from './user.actions';
import { UserResponse } from "./user.models";

const USER_KEY = 'user_session';

function tokenExpirado(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

type Action = fromActions.All;

@Injectable()
export class UserEffects {

  constructor(
    private actions: Actions,
    private router: Router,
    private httpClient: HttpClient,
    private notification: NotificationService
  ) { }

  signUpEmail: Observable<Action> = createEffect(() =>
    this.actions.pipe(
      ofType(fromActions.Types.SIGN_UP_EMAIL),
      map((action: fromActions.SignUpEmail) => action.user),
      switchMap(userData =>
        this.httpClient.post<UserResponse>(`${environment.url}api/Usuario/registrar`, userData)
          .pipe(
            tap((response: UserResponse) => {
              localStorage.setItem('token', response.token);
              localStorage.setItem(USER_KEY, JSON.stringify(response));
              this.router.navigate(['/']);
            }),
            map((response: UserResponse) => new fromActions.SignUpEmailSuccess(response.email, response || null)),
            catchError(err => {
              this.notification.error("Errores al registrar nuevo usuario");
              return of(new fromActions.SignUpEmailError(err.message));
            })
          )
      )
    )
  );

  signInEmail: Observable<Action> = createEffect(() =>
    this.actions.pipe(
      ofType(fromActions.Types.SIGIN_IN_EMAIL),
      map((action: fromActions.SignInEmail) => action.credentials),
      switchMap(credentials =>
        this.httpClient.post<UserResponse>(`${environment.url}api/Usuario/login`, credentials)
          .pipe(
            tap((response: UserResponse) => {
              localStorage.setItem('token', response.token);
              localStorage.setItem(USER_KEY, JSON.stringify(response));
              const destino = response.sucursalId == null ? '/seleccionar-sucursal' : '/';
              this.router.navigate([destino]);
            }),
            map((response: UserResponse) => new fromActions.SignInEmailSuccess(response.email, response || null)),
            catchError(err => {
              this.notification.error("Credenciales incorrectas");
              return of(new fromActions.SignInEmailError(err.message));
            })
          )
      )
    )
  );

  init: Observable<Action> = createEffect(() =>
    this.actions.pipe(
      ofType(fromActions.Types.INIT),
      switchMap(() => {
        const token = localStorage.getItem('token');

        if (!token || tokenExpirado(token)) {
          localStorage.removeItem('token');
          localStorage.removeItem(USER_KEY);
          return of(new fromActions.InitUnauthorized());
        }

        return this.httpClient.get<UserResponse>(`${environment.url}api/Usuario`).pipe(
          tap((user: UserResponse) => {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            if (user.sucursalId == null) {
              this.router.navigate(['/seleccionar-sucursal']);
            }
          }),
          map((user: UserResponse) => new fromActions.InitAuthorized(user.email!, user)),
          catchError(() => {
            localStorage.removeItem('token');
            localStorage.removeItem(USER_KEY);
            return of(new fromActions.InitUnauthorized());
          })
        );
      })
    )
  );
}
