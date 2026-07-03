import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';

@Component({
  selector: 'app-descuento-alumno-dialog',
  templateUrl: './descuento-alumno-dialog.component.html',
  styleUrls: ['./descuento-alumno-dialog.component.scss'],
})
export class DescuentoAlumnoDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private alumnoService: AlumnoService,
    private dialogRef: MatDialogRef<DescuentoAlumnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public alumno: AlumnoResponse
  ) {
    this.form = this.fb.group({
      descuento:       [alumno.descuento ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      motivoDescuento: [alumno.motivoDescuento ?? ''],
    });
  }

  get descuentoCambio(): boolean {
    const actual = this.form.get('descuento')?.value ?? 0;
    return actual !== (this.alumno.descuento ?? 0);
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { descuento, motivoDescuento } = this.form.value;
    this.alumnoService.actualizarDescuento(this.alumno.identidad, descuento, motivoDescuento).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.loading = false; }
    });
  }
}
