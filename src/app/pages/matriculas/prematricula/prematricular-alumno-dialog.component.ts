import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import { AlumnoResponse, AlumnoService } from '@app/services/alumno/alumno.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { PrematriculaService } from '@app/services/prematricula/prematricula.service';
import { toLocalDateStr } from '@app/utils/date.utils';

export interface PrematricularAlumnoResultado {
  identidad:    string;
  alumnoNombre: string;
  gradoNombre:  string;
}

// Prematricula a un alumno actual para el año siguiente: se busca entre los activos,
// se elige grado, sección y fecha de inicio. No crea CxC.
@Component({
  selector: 'app-prematricular-alumno-dialog',
  templateUrl: './prematricular-alumno-dialog.component.html',
  styleUrls: ['./prematricula.component.scss']
})
export class PrematricularAlumnoDialogComponent implements OnInit {

  busqueda = '';
  buscando = false;
  resultados: AlumnoResponse[] = [];
  alumno: AlumnoResponse | null = null;

  grados: GradoDto[] = [];
  idGrado: number | null = null;
  seccion = 'A';
  fechaInicio: Date;
  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { anio: number },
    private dialogRef: MatDialogRef<PrematricularAlumnoDialogComponent, PrematricularAlumnoResultado>,
    private alumnoService: AlumnoService,
    private catalogoService: CatalogoService,
    private prematriculaService: PrematriculaService,
    private notification: NotificationService
  ) {
    this.fechaInicio = new Date(data.anio, 1, 1);   // 1 de febrero del año de la prematrícula
  }

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = (g ?? []).sort((a, b) => a.orden - b.orden));
  }

  buscar(): void {
    if (!this.busqueda.trim()) return;
    this.buscando = true;
    this.alumnoService.getAlumnos(1, 10, this.busqueda, undefined, 'Activo').subscribe({
      next: (r) => { this.resultados = r ?? []; this.buscando = false; },
      error: () => { this.resultados = []; this.buscando = false; }
    });
  }

  elegir(a: AlumnoResponse): void {
    this.alumno = a;
    this.seccion = a.seccion || 'A';
    // Grado sugerido: el siguiente por orden (si no hay, el mismo)
    const actual = this.grados.find(g => g.idGrado === a.idGrado);
    const siguiente = actual ? this.grados.find(g => g.orden > actual.orden) : undefined;
    this.idGrado = siguiente?.idGrado ?? a.idGrado ?? null;
  }

  get fechaValida(): boolean {
    return !!this.fechaInicio && this.fechaInicio.getFullYear() > new Date().getFullYear();
  }

  guardar(): void {
    if (!this.alumno || !this.idGrado || !this.fechaValida || this.guardando) return;
    const alumno = this.alumno;
    const idGrado = this.idGrado;

    this.guardando = true;
    this.prematriculaService.prematricularAlumno({
      identidad:         alumno.identidad,
      idGrado,
      seccion:           (this.seccion || 'A').toUpperCase(),
      fechaInicioClases: toLocalDateStr(this.fechaInicio),
    }).subscribe({
      next: () => {
        this.notification.success('Alumno prematriculado');
        this.dialogRef.close({
          identidad:    alumno.identidad,
          alumnoNombre: alumno.nombreCompleto,
          gradoNombre:  this.grados.find(g => g.idGrado === idGrado)?.gradoNombre ?? '',
        });
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err.error?.errores?.mensaje ?? 'Error al prematricular');
      }
    });
  }
}
