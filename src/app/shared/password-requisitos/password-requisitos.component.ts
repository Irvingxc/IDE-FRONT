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
}
