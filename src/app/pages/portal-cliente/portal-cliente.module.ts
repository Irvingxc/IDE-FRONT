import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PortalClienteComponent } from './portal-cliente.component';

@NgModule({
  declarations: [PortalClienteComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: PortalClienteComponent }]),
    MatButtonModule, MatIconModule, MatTableModule, MatTabsModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule
  ]
})
export class PortalClienteModule {}
