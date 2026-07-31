import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, PeriodoResponse } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface PeriodoDialogData {
  periodo?: PeriodoResponse;
  anioLectivo?: number;
}

@Component({
  selector: 'app-periodo-dialog',
  templateUrl: './periodo-dialog.component.html',
  styleUrls: ['./periodo-dialog.component.scss'],
})
export class PeriodoDialogComponent {
  form: FormGroup;
  loading = false;
  esEdicion: boolean;

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<PeriodoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PeriodoDialogData
  ) {
    this.esEdicion = !!data.periodo;
    const p = data.periodo;

    this.form = this.fb.group({
      nombre:      [p?.nombre ?? '', Validators.required],
      fechaDesde:  [p ? new Date(p.fechaDesde) : null, Validators.required],
      fechaHasta:  [p ? new Date(p.fechaHasta) : null, Validators.required],
      anioLectivo: [p?.anioLectivo ?? data.anioLectivo ?? new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const v = this.form.value;
    const dto = {
      nombre:      v.nombre,
      fechaDesde:  this.toIsoDate(v.fechaDesde),
      fechaHasta:  this.toIsoDate(v.fechaHasta),
      anioLectivo: v.anioLectivo,
    };

    const request = this.esEdicion
      ? this.academicoService.actualizarPeriodo(this.data.periodo!.id, dto)
      : this.academicoService.crearPeriodo(dto);

    request.subscribe({
      next: () => {
        this.notification.success(this.esEdicion ? 'Periodo actualizado correctamente' : 'Periodo creado correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al guardar el periodo');
        this.loading = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  private toIsoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
