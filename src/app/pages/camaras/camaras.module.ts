import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CamarasComponent } from './camaras.component';

const routes: Routes = [{ path: '', component: CamarasComponent }];

@NgModule({
  declarations: [CamarasComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
  ]
})
export class CamarasModule {}
