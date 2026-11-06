import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { PruebasAspirantesComponent } from './pruebas-aspirantes.component';
import { DetallePruebaDialogComponent } from './detalle-prueba-dialog.component';

const routes: Routes = [{ path: '', component: PruebasAspirantesComponent }];

@NgModule({
  declarations: [PruebasAspirantesComponent, DetallePruebaDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatMenuModule, MatProgressSpinnerModule, MatSelectModule, MatTableModule,
  ]
})
export class PruebasAspirantesModule {}
