import { Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';

// Muestra y lee las fechas de los datepickers como dd/mm/aaaa.
export class EsDdMmYyyyDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/').map(Number);
      if (d && m && y) return new Date(y, m - 1, d);
    }
    return super.parse(value);
  }
}

export const FECHA_DD_MM_YYYY_PROVIDERS: Provider[] = [
  { provide: MAT_DATE_LOCALE, useValue: 'es-HN' },
  { provide: DateAdapter, useClass: EsDdMmYyyyDateAdapter },
];
