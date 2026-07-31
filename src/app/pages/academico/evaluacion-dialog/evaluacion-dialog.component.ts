import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface EvaluacionDialogData {
  idSemana: number;
  idClase: number;
}

@Component({
  selector: 'app-evaluacion-dialog',
  templateUrl: './evaluacion-dialog.component.html',
  styleUrls: ['./evaluacion-dialog.component.scss'],
})
export class EvaluacionDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<EvaluacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EvaluacionDialogData
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.academicoService.crearEvaluacion({
      idSemana: this.data.idSemana,
      idClase: this.data.idClase,
      nombre: this.form.value.nombre,
    }).subscribe({
      next: () => {
        this.notification.success('Evaluación creada correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al crear la evaluación');
        this.loading = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
