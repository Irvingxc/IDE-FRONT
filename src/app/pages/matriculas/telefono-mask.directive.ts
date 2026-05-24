import { Directive, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

export interface PaisTelefono {
  codigo:      string;
  nombre:      string;
  formato:     string;
  placeholder: string;
}

export const PAISES_TELEFONO: PaisTelefono[] = [
  { codigo: '+504', nombre: 'Honduras',    formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+502', nombre: 'Guatemala',   formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+503', nombre: 'El Salvador', formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+505', nombre: 'Nicaragua',   formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+506', nombre: 'Costa Rica',  formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+507', nombre: 'Panamá',      formato: '9999-9999',      placeholder: '9999-9999' },
  { codigo: '+501', nombre: 'Belice',      formato: '999-9999',       placeholder: '999-9999' },
  { codigo: '+52',  nombre: 'México',      formato: '99-9999-9999',   placeholder: '99-9999-9999' },
  { codigo: '+1',   nombre: 'USA / Canadá',formato: '(999) 999-9999', placeholder: '(999) 999-9999' },
  { codigo: '+34',  nombre: 'España',      formato: '999 999 999',    placeholder: '999 999 999' },
];

export function aplicarMascaraTelefono(valor: string, formato: string): string {
  const digits = valor.replace(/\D/g, '');
  let result = '';
  let di = 0;
  for (let i = 0; i < formato.length && di < digits.length; i++) {
    if (formato[i] === '9') {
      result += digits[di++];
    } else {
      result += formato[i];
      if (digits[di] === formato[i]) di++;
    }
  }
  return result;
}

@Directive({ selector: '[appTelefonoMask]' })
export class TelefonoMaskDirective {
  @Input('appTelefonoMask') formato = '9999-9999';

  constructor(private control: NgControl) {}

  @HostListener('input')
  onInput(): void {
    const raw = this.control.value ?? '';
    const masked = aplicarMascaraTelefono(raw, this.formato);
    if (masked !== raw) {
      this.control.control?.setValue(masked, { emitEvent: false });
    }
  }
}
