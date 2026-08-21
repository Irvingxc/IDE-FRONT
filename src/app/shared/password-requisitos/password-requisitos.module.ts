import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PasswordRequisitosComponent } from './password-requisitos.component';

@NgModule({
  declarations: [
    PasswordRequisitosComponent
  ],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [
    PasswordRequisitosComponent
  ]
})
export class PasswordRequisitosModule { }
