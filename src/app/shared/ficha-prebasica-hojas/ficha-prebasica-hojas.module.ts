import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FichaPrebasicaHojasComponent } from './ficha-prebasica-hojas.component';

@NgModule({
  declarations: [
    FichaPrebasicaHojasComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    FichaPrebasicaHojasComponent
  ]
})
export class FichaPrebasicaHojasModule { }
