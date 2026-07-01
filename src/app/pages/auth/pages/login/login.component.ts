import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import { select, Store } from '@ngrx/store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loading$!: Observable<boolean | null>;
  errorMsg: string | null = null;

  cooldownSeconds = 0;
  private failedAttempts = 0;
  private cooldownTimer?: ReturnType<typeof setInterval>;
  private storeSub?: Subscription;

  constructor(private store: Store<fromRoot.State>) {}

  ngOnInit(): void {
    this.loading$ = this.store.pipe(select(fromUser.getLoading));

    this.storeSub = this.store.pipe(
      select(fromUser.getUserState),
      filter(s => s.loading === false),
      distinctUntilChanged((a, b) => a.error === b.error && a.email === b.email)
    ).subscribe(state => {
      if (state.error && !state.email) {
        this.errorMsg = state.error;
        this.failedAttempts++;
        this.startCooldown();
      } else if (state.email) {
        this.errorMsg = null;
        this.failedAttempts = 0;
        this.clearCooldown();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearCooldown();
    this.storeSub?.unsubscribe();
  }

  get isBlocked(): boolean {
    return this.cooldownSeconds > 0;
  }

  private startCooldown(): void {
    this.clearCooldown();
    // Backoff exponencial: 5s, 10s, 20s, 40s... máx 120s
    const delay = Math.min(5 * Math.pow(2, this.failedAttempts - 1), 120);
    this.cooldownSeconds = delay;
    this.cooldownTimer = setInterval(() => {
      this.cooldownSeconds--;
      if (this.cooldownSeconds <= 0) this.clearCooldown();
    }, 1000);
  }

  private clearCooldown(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
    this.cooldownSeconds = 0;
  }

  loginUsuario(form: NgForm): void {
    if (this.isBlocked) return;
    this.errorMsg = null;
    const userLoginRequest: fromUser.EmailPasswordCredentials = {
      email: form.value.email,
      password: form.value.password
    };
    this.store.dispatch(new fromUser.SignInEmail(userLoginRequest));
  }
}
