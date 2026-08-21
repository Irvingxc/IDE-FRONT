import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { passwordRequisitosValidator } from '@app/utils/password.utils';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmar = control.get('passwordConfirmar')?.value;
  return nueva && confirmar && nueva !== confirmar ? { passwordsDistintas: true } : null;
}

export interface ResetPasswordDialogData {
  id: string;
  nombreCompleto: string;
}

@Component({
  selector: 'app-reset-password-dialog',
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
})
export class ResetPasswordDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResetPasswordDialogData
  ) {
    this.form = this.fb.group({
      passwordNueva:     ['', [Validators.required, passwordRequisitosValidator()]],
      passwordConfirmar: ['', Validators.required],
    }, { validators: passwordsIgualesValidator });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const { passwordNueva } = this.form.value;
    this.usuarioService.resetPassword(this.data.id, passwordNueva).subscribe({
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
