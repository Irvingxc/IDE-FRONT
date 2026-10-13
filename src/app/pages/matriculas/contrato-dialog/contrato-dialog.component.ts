import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';
import { ContratoService } from '@app/services/contrato/contrato.service';
import { Prematriculado, PrematriculaService } from '@app/services/prematricula/prematricula.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogoService, GradoPrecioFlat } from '@app/services/catalogo/catalogo.service';

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
  private readonly anioActual = new Date().getFullYear();

  alumnos: AlumnoResponse[] = [];               // activos y prematriculados del cliente
  prematriculas: Prematriculado[] = [];
  alumnoElegido: AlumnoResponse | null = null;
  anio = this.anioActual;
  /** Alumno con los datos del contrato para el año elegido (grado, mensualidad y descuento). */
  alumnoSeleccionado: AlumnoResponse | null = null;
  cargando = true;
  cargandoPrecio = false;

  private preciosPorAnio = new Map<number, GradoPrecioFlat[]>();
  private calculo = 0;   // descarta respuestas viejas si cambian alumno/año rapido

  constructor(
    private alumnoService: AlumnoService,
    private contratoService: ContratoService,
    private prematriculaService: PrematriculaService,
    private catalogoService: CatalogoService,
    private dialogRef: MatDialogRef<ContratoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cliente: ClienteResponse
  ) {}

  ngOnInit(): void {
    forkJoin({
      activos: this.alumnoService.getAlumnos(1, 100, '', undefined, 'Activo', this.cliente.id),
      nuevos:  this.alumnoService.getAlumnos(1, 100, '', undefined, 'Prematriculado', this.cliente.id),
      premat:  this.prematriculaService.listar(this.anioActual + 1).pipe(catchError(() => of([] as Prematriculado[]))),
    }).subscribe({
      next: ({ activos, nuevos, premat }) => {
        this.alumnos = [...(activos ?? []), ...(nuevos ?? [])];
        this.prematriculas = (premat ?? []).filter(p => this.alumnos.some(a => a.identidad === p.identidad));
        this.cargando = false;
        if (this.alumnos.length === 1) this.elegirAlumno(this.alumnos[0]);
      },
      error: () => { this.cargando = false; }
    });
  }

  /** Años disponibles: el actual, el siguiente y el de una prematrícula del alumno. */
  get anios(): number[] {
    const anios = new Set([this.anioActual, this.anioActual + 1]);
    this.prematriculas.filter(p => p.identidad === this.alumnoElegido?.identidad).forEach(p => anios.add(p.anioLectivo));
    return [...anios].sort();
  }

  prematriculaDe(a: AlumnoResponse | null, anio: number): Prematriculado | undefined {
    return a ? this.prematriculas.find(p => p.identidad === a.identidad && p.anioLectivo === anio) : undefined;
  }

  esPrematriculado(a: AlumnoResponse): boolean {
    return this.prematriculas.some(p => p.identidad === a.identidad);
  }

  // Alumno nuevo prematriculado: por defecto el año de su prematrícula; si no, el actual.
  elegirAlumno(a: AlumnoResponse): void {
    this.alumnoElegido = a;
    this.anio = a.estado === 'Prematriculado'
      ? (this.prematriculas.find(p => p.identidad === a.identidad)?.anioLectivo ?? this.anioActual + 1)
      : this.anioActual;
    this.recalcular();
  }

  elegirAnio(anio: number): void {
    this.anio = anio;
    this.recalcular();
  }

  // Grado: el de la prematrícula de ese año si existe; si no, el actual del alumno.
  // Mensualidad: la de la tabla de precios de ese año para ese grado (si no hay, la del alumno).
  private recalcular(): void {
    const a = this.alumnoElegido;
    if (!a) { this.alumnoSeleccionado = null; return; }

    const pm = this.prematriculaDe(a, this.anio);
    const idGrado = pm?.idGrado ?? a.idGrado;
    const base: AlumnoResponse = pm
      ? { ...a, grado: [pm.gradoNombre, pm.seccion].filter(Boolean).join(' '), seccion: pm.seccion }
      : a;
    this.alumnoSeleccionado = base;

    const anio = this.anio;
    const id = ++this.calculo;
    const aplicar = (precios: GradoPrecioFlat[]) => {
      if (id !== this.calculo) return;
      const mens = precios.find(x => x.idGrado === idGrado && x.idProducto === 2);
      // Solo el precio del catálogo para ese año; sin precio cargado queda en 0 (L. 0.00)
      this.alumnoSeleccionado = { ...base, valorMensualidad: mens?.precio ?? 0 };
      this.cargandoPrecio = false;
    };

    const cache = this.preciosPorAnio.get(anio);
    if (cache) { aplicar(cache); return; }

    this.cargandoPrecio = true;
    this.catalogoService.getGradosConPrecios(`${anio}-01-01`).subscribe({
      next: (p) => { this.preciosPorAnio.set(anio, p ?? []); aplicar(p ?? []); },
      error: () => { if (id === this.calculo) this.cargandoPrecio = false; }
    });
  }

  get mensualNeto(): number {
    if (!this.alumnoSeleccionado) return 0;
    const base = this.alumnoSeleccionado.valorMensualidad ?? 0;
    const pct  = this.alumnoSeleccionado.descuento ?? 0;
    return base * (1 - pct / 100);
  }

  generar(): void {
    this.contratoService.generarContrato(this.cliente, this.alumnoSeleccionado, this.anio);
    this.dialogRef.close();
  }
}
