import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PruebaAspiranteComponent } from './prueba-aspirante.component';

const routes: Routes = [
  { path: '', component: PruebaAspiranteComponent },
  { path: ':codigo', component: PruebaAspiranteComponent },
];

@NgModule({
  declarations: [PruebaAspiranteComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule,
  ]
})
export class PruebaAspiranteModule {}
