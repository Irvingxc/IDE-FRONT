import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AcademicoService, GuardarNotaActividadItem, PrevisualizacionImportacionNotas } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface ImportarNotasDialogData {
  idClase:        number;
  idPeriodo:      number;
  claseNombre?:   string;
  periodoNombre?: string;
  vista:          PrevisualizacionImportacionNotas;
}

// Vista previa de la importacion de la plantilla Excel: muestra cada cambio (nota anterior
// -> nueva) y los errores. Si hay errores no se puede importar; al confirmar se guardan
// solo los cambios con el mismo endpoint de la grilla.
@Component({
  selector: 'app-importar-notas-dialog',
  templateUrl: './importar-notas-dialog.component.html',
  styleUrls: ['./importar-notas-dialog.component.scss']
})
export class ImportarNotasDialogComponent {

  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImportarNotasDialogData,
    private dialogRef: MatDialogRef<ImportarNotasDialogComponent>,
    private academicoService: AcademicoService,
    private notification: NotificationService
  ) {}

  get vista(): PrevisualizacionImportacionNotas { return this.data.vista; }

  get puedeImportar(): boolean {
    return this.vista.errores.length === 0 && this.vista.cambios.length > 0 && !this.guardando;
  }

  importar(): void {
    if (!this.puedeImportar) return;

    const notas: GuardarNotaActividadItem[] = this.vista.cambios.map(c => ({
      idAlumno: c.idAlumno, idActividad: c.idActividad, nota: c.notaNueva
    }));

    this.guardando = true;
    this.academicoService.guardarNotasActividad(this.data.idClase, this.data.idPeriodo, notas).subscribe({
      next: () => {
        this.notification.success(`Se importaron ${notas.length} nota(s) correctamente`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err.error?.errores?.mensaje ?? 'Error al guardar las notas importadas');
      }
    });
  }

  fmt(n: number | null): string {
    return n == null ? '—' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
