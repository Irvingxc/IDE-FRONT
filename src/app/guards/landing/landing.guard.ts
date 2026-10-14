import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map, Observable } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

/**
 * La landing pública solo se muestra sin sesión; con sesión manda al panel o al portal.
 * canLoad se evalúa una sola vez (al descargar el módulo): si alguien abrió la landing
 * y luego inició sesión, volver a "/" ya no pasaba por el guard. Por eso también canActivate.
 */
@Injectable({ providedIn: 'root' })
export class LandingGuard implements CanLoad, CanActivate {

  constructor(private store: Store<fromRoot.State>, private router: Router) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return this.check();
  }

  canActivate(): Observable<boolean | UrlTree> {
    return this.check();
  }

  private check(): Observable<boolean | UrlTree> {
    return this.store.pipe(
      select(fromUser.getUserState),
      filter(state => !state.loading),
      map(state => {
        if (!state.email) return true;
        const destino = state.entity?.roles?.includes('Cliente') ? '/portal-cliente' : '/static/welcome';
        return this.router.createUrlTree([destino]);
      })
    );
  }
}
