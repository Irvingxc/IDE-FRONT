import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AcademicoRoutingModule } from './academico-routing.module';
import { AcademicoComponent } from './academico.component';
import { PeriodoDialogComponent } from './periodo-dialog/periodo-dialog.component';
import { ClaseDialogComponent } from './clase-dialog/clase-dialog.component';
import { EvaluacionDialogComponent } from './evaluacion-dialog/evaluacion-dialog.component';
import { NotasDialogComponent } from './notas-dialog/notas-dialog.component';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
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
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/').map(Number);
      if (d && m && y) return new Date(y, m - 1, d);
    }
    return super.parse(value);
  }
}

@NgModule({
  declarations: [
    AcademicoComponent,
    PeriodoDialogComponent,
    ClaseDialogComponent,
    EvaluacionDialogComponent,
    NotasDialogComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AcademicoRoutingModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
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
export class AcademicoModule {}
