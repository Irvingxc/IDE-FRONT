import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivarCuentaComponent } from './activar-cuenta.component';
import { PasswordRequisitosModule } from '@app/shared/password-requisitos/password-requisitos.module';

@NgModule({
  declarations: [ActivarCuentaComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: ActivarCuentaComponent }]),
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule, MatProgressBarModule,
    PasswordRequisitosModule
  ]
})
export class ActivarCuentaModule {}
