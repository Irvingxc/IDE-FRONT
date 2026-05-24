import { Component, OnInit } from '@angular/core';
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
export class RegistrarUsuarioDialogComponent implements OnInit {

  form: FormGroup;
  guardando = false;
  roles: string[] = [];
  sucursales: { id: number; nombre: string }[] = [];

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
      rol:               ['', Validators.required],
      sucursalId:        [null],
      aula:              [null],
      password:          ['', [Validators.required, Validators.minLength(7)]],
      confirmarPassword: ['', Validators.required],
    }, { validators: passwordsCoinciden });
  }

  ngOnInit(): void {
    this.usuarioService.getRoles().subscribe(r => this.roles = r);
    this.usuarioService.getSucursales().subscribe(s => this.sucursales = s);
  }

  get esMaestro(): boolean {
    return this.form.get('rol')?.value === 'Maestro';
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
