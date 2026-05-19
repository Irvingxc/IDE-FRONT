import { Directive, ElementRef, HostListener, Input, OnChanges, Optional, Self, SimpleChanges } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: 'input[appIdentidadMask]' })
export class IdentidadMaskDirective implements OnChanges {

  @Input() appIdentidadMask: string = '';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private control: NgControl
  ) {}

  private get esDni(): boolean {
    return this.appIdentidadMask === 'DNI / Identidad';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appIdentidadMask'] && !changes['appIdentidadMask'].firstChange) {
      this.el.nativeElement.value = '';
      this.control?.control?.setValue('', { emitEvent: false });
    }
  }

  @HostListener('input')
  onInput(): void {
    if (this.esDni) {
      this.handleDni();
    } else {
      this.handlePasaporte();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const nav = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (this.esDni) {
      if (!/^\d$/.test(e.key)) e.preventDefault();
    } else {
      if (!/^[a-zA-Z0-9]$/.test(e.key)) e.preventDefault();
    }
  }

  private handleDni(): void {
    const digits = this.el.nativeElement.value.replace(/\D/g, '').slice(0, 13);
    const formatted = this.formatDni(digits);
    this.el.nativeElement.value = formatted;
    this.control?.control?.setValue(formatted, { emitEvent: true });
  }

  private handlePasaporte(): void {
    const val = this.el.nativeElement.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase();
    this.el.nativeElement.value = val;
    this.control?.control?.setValue(val, { emitEvent: true });
  }

  private formatDni(digits: string): string {
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
}
