import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, CanActivateChild,
  CanLoad, Route, Router, RouterStateSnapshot, UrlSegment
} from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

@Injectable({ providedIn: 'root' })
export class ModuloGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(private store: Store<fromRoot.State>, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    return this.check(route.data['modulo']);
  }

  canActivateChild(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    return this.check(route.data['modulo']);
  }

  canLoad(route: Route, _segments: UrlSegment[]): Observable<boolean> {
    return this.check(route.data?.['modulo'] ?? '');
  }

  private check(modulo: string): Observable<boolean> {
    return this.store.pipe(
      select(fromUser.getUserState),
      filter(state => !state.loading),
      take(1),
      map(state => {
        if (!state.email || !state.entity) {
          this.router.navigate(['auth/login']);
          return false;
        }

        const modulos: string[] = state.entity.modulos ?? [];

        const tieneAcceso = !modulo || modulos.includes(modulo);

        if (!tieneAcceso) {
          this.router.navigate(['static/welcome']);
        }

        return tieneAcceso;
      })
    );
  }
}
