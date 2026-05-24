import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';
import { ContratoService } from '@app/services/contrato/contrato.service';

@Component({
  selector: 'app-contrato-dialog',
  templateUrl: './contrato-dialog.component.html',
  styles: [`
    .resumen-financiero {
      margin-top: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .resumen-fila {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      font-size: 13px;
      border-bottom: 1px solid #f0f0f0;
    }
    .resumen-fila:last-child { border-bottom: none; }
    .descuento-fila { background: #fff8e1; }
    .total-fila { background: #f5f5f5; }
    .resumen-etiqueta { color: #555; }
    .motivo { font-size: 11px; color: #888; }
    .resumen-valor { font-weight: 500; }
    .resumen-valor.descuento { color: #e65100; }
    .resumen-valor.total { font-size: 15px; color: #1a237e; }
  `]
})
export class ContratoDialogComponent implements OnInit {
  alumnos: AlumnoResponse[] = [];
  alumnoSeleccionado: AlumnoResponse | null = null;
  cargando = true;

  constructor(
    private alumnoService: AlumnoService,
    private contratoService: ContratoService,
    private dialogRef: MatDialogRef<ContratoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cliente: ClienteResponse
  ) {}

  ngOnInit(): void {
    this.alumnoService.getAlumnos(1, 100, '', undefined, 'Activo', this.cliente.id).subscribe({
      next: (data) => {
        this.alumnos  = data ?? [];
        this.cargando = false;
        if (this.alumnos.length === 1) this.seleccionar(this.alumnos[0]);
      },
      error: () => { this.cargando = false; }
    });
  }

  seleccionar(alumno: AlumnoResponse): void {
    this.alumnoSeleccionado = alumno;
  }

  get mensualNeto(): number {
    if (!this.alumnoSeleccionado) return 0;
    return (this.alumnoSeleccionado.valorMensualidad ?? 0) - (this.alumnoSeleccionado.descuento ?? 0);
  }

  generar(): void {
    this.contratoService.generarContrato(this.cliente, this.alumnoSeleccionado);
    this.dialogRef.close();
  }
}
