import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { WelcomeRoutingModule } from './welcome-routing.module';
import { WelcomeComponent } from './welcome.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FranjaPanterasModule } from '@app/shared/franja-panteras/franja-panteras.module';

@NgModule({
  declarations: [
    WelcomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    WelcomeRoutingModule,
    MatCardModule,
    MatIconModule,
    FranjaPanterasModule,
  ]
})
export class WelcomeModule { }
