import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, map, Observable } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

@Injectable({ providedIn: 'root' })
export class LandingGuard implements CanLoad {

  constructor(private store: Store<fromRoot.State>, private router: Router) {}

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    return this.store.pipe(
      select(fromUser.getUserState),
      filter(state => !state.loading),
      map(state => state.email
        ? this.router.createUrlTree(['/static/welcome'])
        : true
      )
    );
  }
}
