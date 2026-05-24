import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CxcRoutingModule } from './cxc-routing.module';
import { CxcComponent } from './cxc.component';
import { EstadoCuentaDialogComponent } from './estado-cuenta-dialog/estado-cuenta-dialog.component';

import { MatTableModule }           from '@angular/material/table';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatDialogModule }          from '@angular/material/dialog';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatSnackBarModule }        from '@angular/material/snack-bar';
import { MatMenuModule }            from '@angular/material/menu';
import { RouterModule }             from '@angular/router';

@NgModule({
  declarations: [
    CxcComponent,
    EstadoCuentaDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CxcRoutingModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatMenuModule,
  ]
})
export class CxcModule {}
