import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AsistenciaService, Feriado } from '@app/services/asistencia/asistencia.service';

@Component({
  selector: 'app-feriados-dialog',
  templateUrl: './feriados-dialog.component.html',
  styleUrls: ['./feriados-dialog.component.scss'],
})
export class FeriadosDialogComponent implements OnInit {
  feriados: Feriado[] = [];
  columnas = ['fecha', 'descripcion', 'acciones'];
  loading = true;
  guardando = false;
  huboCambios = false;

  nuevaFecha: Date | null = null;
  nuevaDescripcion = '';

  constructor(
    private asistenciaService: AsistenciaService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<FeriadosDialogComponent>
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.asistenciaService.getFeriados().subscribe({
      next: (data) => { this.feriados = data; this.loading = false; },
      error: () => { this.loading = false; this.snack.open('No se pudieron cargar los feriados', '', { duration: 3000 }); }
    });
  }

  agregar(): void {
    if (!this.nuevaFecha || !this.nuevaDescripcion.trim()) {
      this.snack.open('Ingresa la fecha y la descripción del feriado', '', { duration: 3000 });
      return;
    }
    this.guardando = true;
    this.asistenciaService.crearFeriado(this.nuevaFecha, this.nuevaDescripcion.trim()).subscribe({
      next: () => {
        this.guardando = false;
        this.huboCambios = true;
        this.nuevaFecha = null;
        this.nuevaDescripcion = '';
        this.cargar();
      },
      error: (err) => {
        this.guardando = false;
        this.snack.open(err?.error?.mensaje ?? 'No se pudo guardar el feriado', '', { duration: 4000 });
      }
    });
  }

  eliminar(f: Feriado): void {
    this.asistenciaService.eliminarFeriado(f.id).subscribe({
      next: () => {
        this.huboCambios = true;
        this.feriados = this.feriados.filter(x => x.id !== f.id);
      },
      error: () => this.snack.open('No se pudo eliminar el feriado', '', { duration: 3000 })
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }
}
