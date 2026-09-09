import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { PASSWORD_REQUISITOS } from '@app/utils/password.utils';

@Component({
  selector: 'app-password-requisitos',
  templateUrl: './password-requisitos.component.html',
  styleUrls: ['./password-requisitos.component.scss']
})
export class PasswordRequisitosComponent {
  @Input() control: AbstractControl | null = null;

  requisitos = PASSWORD_REQUISITOS;

  cumple(key: string): boolean {
    return !!this.control && !this.control.hasError(key);
  }

  // Marca en rojo un requisito no cumplido solo cuando el usuario ya empezó a escribir.
  enRojo(key: string): boolean {
    return !!this.control && !this.cumple(key) && (this.control.dirty || this.control.touched);
  }

  icono(key: string): string {
    if (this.cumple(key)) return 'check_circle';
    return this.enRojo(key) ? 'cancel' : 'radio_button_unchecked';
  }
}
