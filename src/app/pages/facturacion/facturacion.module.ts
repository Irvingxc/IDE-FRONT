import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { FacturacionRoutingModule } from './facturacion-routing.module';
import { FacturacionComponent } from './facturacion.component';
import { NuevaFacturaDialogComponent } from './nueva-factura-dialog/nueva-factura-dialog.component';

import { MatCardModule }             from '@angular/material/card';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatTableModule }            from '@angular/material/table';
import { MatCheckboxModule }         from '@angular/material/checkbox';
import { MatDatepickerModule }       from '@angular/material/datepicker';
import { MatNativeDateModule }       from '@angular/material/core';
import { MatDividerModule }          from '@angular/material/divider';
import { MatSelectModule }           from '@angular/material/select';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';
import { MatDialogModule }           from '@angular/material/dialog';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatAutocompleteModule }     from '@angular/material/autocomplete';
import { MatSnackBarModule }         from '@angular/material/snack-bar';
import { MatPaginatorModule }        from '@angular/material/paginator';

@NgModule({
  declarations: [
    FacturacionComponent,
    NuevaFacturaDialogComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FacturacionRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatPaginatorModule,
  ]
})
export class FacturacionModule { }
