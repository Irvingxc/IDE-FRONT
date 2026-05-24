import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';

@Component({
  selector: 'app-hijos-dialog',
  templateUrl: './hijos-dialog.component.html',
  styleUrls: ['./hijos-dialog.component.scss']
})
export class HijosDialogComponent implements OnInit {

  alumnos: AlumnoResponse[] = [];
  cargando = true;
  columns = ['nombre', 'grado', 'estado'];

  constructor(
    public dialogRef: MatDialogRef<HijosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cliente: ClienteResponse,
    private alumnoService: AlumnoService
  ) {}

  ngOnInit(): void {
    this.alumnoService.getAlumnos(1, 100, '', undefined, '', this.cliente.id).subscribe({
      next: (data) => { this.alumnos = data ?? []; this.cargando = false; },
      error: ()     => { this.cargando = false; }
    });
  }

  cerrar(): void { this.dialogRef.close(); }
}
