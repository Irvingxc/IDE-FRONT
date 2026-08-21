import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportesRoutingModule } from './reportes-routing.module';
import { ReportesComponent } from './reportes.component';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, NativeDateAdapter } from '@angular/material/core';

class EsDdMmYyyyDateAdapter extends NativeDateAdapter {
  override format(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}

@NgModule({
  declarations: [
    ReportesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReportesRoutingModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-HN' },
    { provide: DateAdapter, useClass: EsDdMmYyyyDateAdapter },
  ]
})
export class ReportesModule {}
