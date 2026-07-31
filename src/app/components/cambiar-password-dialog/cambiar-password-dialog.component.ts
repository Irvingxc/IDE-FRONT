import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services/notification/notification.service';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmar = control.get('passwordConfirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { passwordsDistintas: true } : null;
}

@Component({
  selector: 'app-cambiar-password-dialog',
  templateUrl: './cambiar-password-dialog.component.html',
  styleUrls: ['./cambiar-password-dialog.component.scss'],
})
export class CambiarPasswordDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<CambiarPasswordDialogComponent>
  ) {
    this.form = this.fb.group({
      passwordActual:    ['', Validators.required],
      passwordNueva:     ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', Validators.required],
    }, { validators: passwordsIgualesValidator });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const { passwordActual, passwordNueva } = this.form.value;
    this.usuarioService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.notification.success('Contraseña actualizada correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(err.error?.errores?.mensaje ?? 'Error al cambiar la contraseña');
        this.loading = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
