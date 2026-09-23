import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AcademicoRoutingModule } from './academico-routing.module';
import { AcademicoComponent } from './academico.component';
import { PeriodoDialogComponent } from './periodo-dialog/periodo-dialog.component';
import { ClaseDialogComponent } from './clase-dialog/clase-dialog.component';
import { EvaluacionDialogComponent } from './evaluacion-dialog/evaluacion-dialog.component';
import { NotasDialogComponent } from './notas-dialog/notas-dialog.component';
import { NivelInglesDialogComponent } from './nivel-ingles-dialog/nivel-ingles-dialog.component';
import { HistorialNotasDialogComponent } from './historial-notas-dialog/historial-notas-dialog.component';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FECHA_DD_MM_YYYY_PROVIDERS } from '@app/utils/date-adapter';

@NgModule({
  declarations: [
    AcademicoComponent,
    PeriodoDialogComponent,
    ClaseDialogComponent,
    EvaluacionDialogComponent,
    NotasDialogComponent,
    NivelInglesDialogComponent,
    HistorialNotasDialogComponent,
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
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: FECHA_DD_MM_YYYY_PROVIDERS,
})
export class AcademicoModule {}
