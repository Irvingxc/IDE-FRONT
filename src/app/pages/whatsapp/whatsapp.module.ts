import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WhatsappRoutingModule } from './whatsapp-routing.module';
import { WhatsappComponent } from './whatsapp.component';
import { EnviarMensajeDialogComponent } from './enviar-mensaje-dialog/enviar-mensaje-dialog.component';
import { AvisoAusenciaDialogComponent } from './aviso-ausencia-dialog/aviso-ausencia-dialog.component';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FECHA_DD_MM_YYYY_PROVIDERS } from '@app/utils/date-adapter';

@NgModule({
  declarations: [
    WhatsappComponent,
    EnviarMensajeDialogComponent,
    AvisoAusenciaDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    WhatsappRoutingModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: FECHA_DD_MM_YYYY_PROVIDERS
})
export class WhatsappModule {}
