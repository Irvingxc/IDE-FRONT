import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PortalClienteService, ValidarInvitacionResponse } from '@app/services/portal-cliente/portal-cliente.service';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

@Component({
  selector: 'app-activar-cuenta',
  templateUrl: './activar-cuenta.component.html',
  styleUrls: ['./activar-cuenta.component.scss']
})
export class ActivarCuentaComponent implements OnInit {

  estado: 'cargando' | 'valido' | 'invalido' | 'activando' | 'listo' = 'cargando';
  invitacion: ValidarInvitacionResponse | null = null;
  form!: FormGroup;
  errorMsg: string | null = null;
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private portalService: PortalClienteService,
    private store: Store<fromRoot.State>
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.form = this.fb.group({
      password:  ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required]
    }, { validators: this.passwordsIguales });

    this.portalService.validarToken(this.token).subscribe({
      next: (inv) => {
        this.invitacion = inv;
        this.estado = inv.estado === 'VALIDO' ? 'valido' : 'invalido';
      },
      error: () => { this.estado = 'invalido'; }
    });
  }

  private passwordsIguales(g: AbstractControl) {
    return g.get('password')?.value === g.get('confirmar')?.value
      ? null : { noCoinciden: true };
  }

  activar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.estado = 'activando';
    this.errorMsg = null;

    this.portalService.activarCuenta({ token: this.token, password: this.form.value.password })
      .subscribe({
        next: (user) => {
          localStorage.setItem('token', user.token);
          localStorage.setItem('user_session', JSON.stringify(user));
          this.store.dispatch(new fromUser.InitAuthorized(user.email, user));
          this.estado = 'listo';
          setTimeout(() => this.router.navigate(['/portal-cliente']), 2000);
        },
        error: (err) => {
          this.errorMsg = err?.error?.errors?.mensaje ?? 'Error al activar la cuenta.';
          this.estado = 'valido';
        }
      });
  }
}
