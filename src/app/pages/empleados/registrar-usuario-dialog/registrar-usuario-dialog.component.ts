import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services';

function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmar = control.get('confirmarPassword')?.value;
  return password && confirmar && password !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-registrar-usuario-dialog',
  templateUrl: './registrar-usuario-dialog.component.html',
  styleUrls: ['./registrar-usuario-dialog.component.scss']
})
export class RegistrarUsuarioDialogComponent {

  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RegistrarUsuarioDialogComponent>,
    private usuarioService: UsuarioService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      nombre:            ['', Validators.required],
      apellido:          ['', Validators.required],
      username:          ['', Validators.required],
      telefono:          ['', Validators.required],
      email:             ['', [Validators.required, Validators.email]],
      password:          ['', [Validators.required, Validators.minLength(7)]],
      confirmarPassword: ['', Validators.required],
    }, { validators: passwordsCoinciden });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const { confirmarPassword, ...payload } = this.form.value;

    this.usuarioService.registrar(payload).subscribe({
      next: () => {
        this.notification.success('Usuario registrado correctamente');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notification.error('Error al registrar el usuario');
        this.guardando = false;
      }
    });
  }
}
