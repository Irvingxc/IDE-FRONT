import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '@app/models/backend/user';

export interface PerfilDialogData {
  user: User;
}

@Component({
  selector: 'app-perfil-dialog',
  templateUrl: './perfil-dialog.component.html',
  styleUrls: ['./perfil-dialog.component.scss'],
})
export class PerfilDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<PerfilDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PerfilDialogData
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}
