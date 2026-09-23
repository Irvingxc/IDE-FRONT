import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatriculasRoutingModule } from './matriculas-routing.module';
import { MatriculasComponent } from './matriculas.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { NuevaMatriculaComponent } from './nueva-matricula/nueva-matricula.component';
import { EditClienteDialogComponent } from './edit-cliente-dialog/edit-cliente-dialog.component';
import { EditAlumnoDialogComponent } from './edit-alumno-dialog/edit-alumno-dialog.component';
import { HijosDialogComponent } from './hijos-dialog/hijos-dialog.component';
import { DescuentoAlumnoDialogComponent } from './descuento-alumno-dialog/descuento-alumno-dialog.component';
import { ContratoDialogComponent } from './contrato-dialog/contrato-dialog.component';
import { CarnetAlumnoDialogComponent } from './carnet-alumno-dialog/carnet-alumno-dialog.component';
import { PromocionComponent } from './promocion/promocion.component';
import { PromocionConfirmDialogComponent } from './promocion/promocion-confirm-dialog.component';
import { IdentidadMaskDirective } from './identidad-mask.directive';
import { TelefonoMaskDirective } from './telefono-mask.directive';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FECHA_DD_MM_YYYY_PROVIDERS } from '@app/utils/date-adapter';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@NgModule({
  declarations: [
    MatriculasComponent,
    ConfirmDialogComponent,
    NuevaMatriculaComponent,
    EditClienteDialogComponent,
    EditAlumnoDialogComponent,
    HijosDialogComponent,
    DescuentoAlumnoDialogComponent,
    ContratoDialogComponent,
    CarnetAlumnoDialogComponent,
    PromocionComponent,
    PromocionConfirmDialogComponent,
    IdentidadMaskDirective,
    TelefonoMaskDirective,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatriculasRoutingModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatCardModule,
    MatPaginatorModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonToggleModule,
  ],
  providers: FECHA_DD_MM_YYYY_PROVIDERS,
})
export class MatriculasModule { }
