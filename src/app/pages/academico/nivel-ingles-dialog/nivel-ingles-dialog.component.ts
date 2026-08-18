import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CatalogoService, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface NivelInglesDialogData {
  nivel?: NivelIngles;
}

@Component({
  selector: 'app-nivel-ingles-dialog',
  templateUrl: './nivel-ingles-dialog.component.html',
  styleUrls: ['./nivel-ingles-dialog.component.scss'],
})
export class NivelInglesDialogComponent {
  form: FormGroup;
  loading = false;
  esEdicion: boolean;

  constructor(
    private fb: FormBuilder,
    private catalogoService: CatalogoService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<NivelInglesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NivelInglesDialogData
  ) {
    this.esEdicion = !!data.nivel;
    const n = data.nivel;

    this.form = this.fb.group({
      nombre: [n?.nombre ?? '', Validators.required],
      orden:  [n?.orden ?? 0, Validators.required],
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const dto = this.form.value;

    const request = this.esEdicion
      ? this.catalogoService.actualizarNivelIngles(this.data.nivel!.id, dto)
      : this.catalogoService.crearNivelIngles(dto);

    request.subscribe({
      next: (nivel) => {
        this.notification.success(this.esEdicion ? 'Nivel actualizado correctamente' : 'Nivel creado correctamente');
        this.dialogRef.close(nivel);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al guardar el nivel');
        this.loading = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }
}
