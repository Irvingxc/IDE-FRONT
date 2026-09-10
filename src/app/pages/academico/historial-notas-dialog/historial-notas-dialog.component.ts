import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, HistorialNota } from '@app/services/academico/academico.service';

export interface HistorialNotasDialogData {
  idClase:        number;
  idPeriodo:      number;
  idAlumno:       string;
  alumnoNombre:   string;
  claseNombre?:   string;
  periodoNombre?: string;
}

@Component({
  selector: 'app-historial-notas-dialog',
  templateUrl: './historial-notas-dialog.component.html',
  styleUrls: ['./historial-notas-dialog.component.scss']
})
export class HistorialNotasDialogComponent implements OnInit {

  cargando = true;
  historial: HistorialNota[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistorialNotasDialogData,
    private academicoService: AcademicoService
  ) {}

  ngOnInit(): void {
    this.academicoService.historialNotasAlumno(this.data.idClase, this.data.idPeriodo, this.data.idAlumno)
      .subscribe({
        next: h => { this.historial = h ?? []; this.cargando = false; },
        error: () => { this.historial = []; this.cargando = false; }
      });
  }

  fmt(n: number | null): string {
    return n == null ? '—' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
