import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, EvaluacionResponse, NotaAlumno } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface NotasDialogData {
  evaluacion: EvaluacionResponse;
}

@Component({
  selector: 'app-notas-dialog',
  templateUrl: './notas-dialog.component.html',
  styleUrls: ['./notas-dialog.component.scss'],
})
export class NotasDialogComponent implements OnInit {
  alumnos: NotaAlumno[] = [];
  loading = true;
  guardando = false;

  constructor(
    private academicoService: AcademicoService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<NotasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NotasDialogData
  ) {}

  ngOnInit(): void {
    this.academicoService.listarNotas(this.data.evaluacion.id).subscribe({
      next: (data) => { this.alumnos = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  guardar(): void {
    const notas = this.alumnos
      .filter(a => a.nota !== null && a.nota !== undefined)
      .map(a => ({ idAlumno: a.idAlumno, nota: a.nota as number }));

    if (notas.length === 0) {
      this.notification.error('Ingresa al menos una nota');
      return;
    }

    this.guardando = true;
    this.academicoService.guardarNotas(this.data.evaluacion.id, notas).subscribe({
      next: () => {
        this.notification.success('Notas guardadas correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al guardar las notas');
        this.guardando = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
