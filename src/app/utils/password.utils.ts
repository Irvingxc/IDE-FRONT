import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordRequisitosValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';
    const errors: ValidationErrors = {};

    if (value.length < 6)            errors['longitud']  = true;
    if (!/[a-z]/.test(value))        errors['minuscula'] = true;
    if (!/[A-Z]/.test(value))        errors['mayuscula'] = true;
    if (!/[0-9]/.test(value))        errors['numero']    = true;
    if (!/[^a-zA-Z0-9]/.test(value)) errors['especial']  = true;

    return Object.keys(errors).length ? errors : null;
  };
}

export const PASSWORD_REQUISITOS = [
  { key: 'longitud',  texto: 'Al menos 6 caracteres' },
  { key: 'mayuscula', texto: 'Una letra mayúscula (A-Z)' },
  { key: 'minuscula', texto: 'Una letra minúscula (a-z)' },
  { key: 'numero',    texto: 'Un número (0-9)' },
  { key: 'especial',  texto: 'Un carácter especial (ej. !@#$%)' },
];
