import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AcademicoService, FichaPrebasica, FichaPrebasicaAlumno, FichaPrebasicaIndicador, GuardarFichaPrebasica, ValorFichaPrebasica
} from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';
import {
  AreaFicha, TIPOS_CENTRO, agruparPorArea, imprimirHojasFicha
} from '@app/shared/ficha-prebasica-hojas/ficha-prebasica-hojas.component';

/** Lo que se edita de la ficha (anual) de un alumno. */
interface FichaEdit {
  observaciones: string;
  valores:       { [idIndicador: number]: ValorFichaPrebasica };
}

// Clase que se pone al <body> mientras esta página está abierta (ajusta el alto de <main> para la barra fija).
const CLASE_BODY = 'ficha-pb-abierta';

@Component({
  selector: 'app-ficha-prebasica',
  templateUrl: './ficha-prebasica.component.html',
  styleUrls: ['./ficha-prebasica.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FichaPrebasicaComponent implements OnInit, OnDestroy {
  @ViewChild('impresion') impresion?: ElementRef<HTMLElement>;

  idClase: number | null = null;
  ficha: FichaPrebasica | null = null;
  areas: AreaFicha[] = [];
  cargando = true;
  guardando = false;
  error: string | null = null;

  indiceAlumno = 0;
  busquedaAlumno = '';

  // Ediciones pendientes por alumno (idAlumno); lo que no está aquí se lee de lo guardado.
  private ediciones = new Map<string, FichaEdit>();
  private pendientes = new Set<string>();

  nombreCentro = '';
  municipio = '';
  tipoCentro = new Set<string>();
  centroModificado = false;

  /** Alumnos que se dibujan al imprimir; normalmente solo el actual. */
  alumnosImpresion: FichaPrebasicaAlumno[] = [];

  constructor(
    private route: ActivatedRoute,
    private academicoService: AcademicoService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    document.body.classList.add(CLASE_BODY);
    const id = Number(this.route.snapshot.queryParamMap.get('idClase'));
    if (!id) {
      this.cargando = false;
      this.error = 'Falta indicar la clase. Abre la ficha desde Gestión académica > Notas.';
      return;
    }
    this.idClase = id;
    this.cargar();
  }

  ngOnDestroy(): void {
    document.body.classList.remove(CLASE_BODY);
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarCambiosSinGuardar(event: BeforeUnloadEvent): void {
    if (this.hayCambios) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // ── Carga ────────────────────────────────────────────────
  cargar(): void {
    if (!this.idClase) return;
    this.cargando = true;
    this.academicoService.obtenerFichaPrebasica(this.idClase).subscribe({
      next: (ficha) => {
        this.aplicarFicha(ficha);
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.errores?.mensaje ?? err.error?.mensaje ?? 'No se pudo cargar la ficha de evaluación.';
      }
    });
  }

  private aplicarFicha(ficha: FichaPrebasica): void {
    const idActual = this.alumnoActual?.idAlumno;
    this.ficha = ficha;

    this.areas = agruparPorArea(ficha.indicadores);

    this.nombreCentro = ficha.nombreCentro ?? '';
    this.municipio = ficha.municipio ?? '';
    this.tipoCentro = new Set((ficha.tipoCentro ?? '').split(',').filter(c => c));
    this.centroModificado = false;

    this.ediciones.clear();
    this.pendientes.clear();

    const indice = ficha.alumnos.findIndex(a => a.idAlumno === idActual);
    this.indiceAlumno = indice >= 0 ? indice : 0;
  }

  // ── Encabezado ───────────────────────────────────────────
  get alumnoActual(): FichaPrebasicaAlumno | null {
    return this.ficha?.alumnos[this.indiceAlumno] ?? null;
  }

  // ── Alumnos ──────────────────────────────────────────────
  get alumnosFiltrados(): { alumno: FichaPrebasicaAlumno; indice: number }[] {
    const term = this.busquedaAlumno.trim().toLowerCase();
    return (this.ficha?.alumnos ?? [])
      .map((alumno, indice) => ({ alumno, indice }))
      .filter(x => !term || x.alumno.nombreCompleto.toLowerCase().includes(term) || String(x.alumno.codigo).includes(term));
  }

  seleccionarAlumno(indice: number): void {
    this.indiceAlumno = indice;
    window.scrollTo({ top: 0 });
  }

  anterior(): void {
    if (this.indiceAlumno > 0) this.seleccionarAlumno(this.indiceAlumno - 1);
  }

  siguiente(): void {
    if (this.ficha && this.indiceAlumno < this.ficha.alumnos.length - 1) this.seleccionarAlumno(this.indiceAlumno + 1);
  }

  marcados(alumno: FichaPrebasicaAlumno): number {
    return Object.keys(this.leer(alumno).valores).length;
  }

  get totalIndicadores(): number {
    return this.ficha?.indicadores.length ?? 0;
  }

  tienePendientes(alumno: FichaPrebasicaAlumno): boolean {
    return this.pendientes.has(alumno.idAlumno);
  }

  // ── Lectura / edición ────────────────────────────────────
  /** Lo que se ve para el alumno: lo editado, o lo guardado. */
  leer(alumno: FichaPrebasicaAlumno): FichaEdit {
    return this.ediciones.get(alumno.idAlumno)
      ?? { observaciones: alumno.observaciones ?? '', valores: alumno.valores ?? {} };
  }

  /** Copia editable del alumno, creada la primera vez que se toca. */
  private editar(alumno: FichaPrebasicaAlumno): FichaEdit {
    let edit = this.ediciones.get(alumno.idAlumno);
    if (!edit) {
      const actual = this.leer(alumno);
      edit = { observaciones: actual.observaciones, valores: { ...actual.valores } };
      this.ediciones.set(alumno.idAlumno, edit);
    }
    this.pendientes.add(alumno.idAlumno);
    return edit;
  }

  /** Clic en la casilla: la marca; si ya estaba marcada, la desmarca. */
  marcar(indicador: FichaPrebasicaIndicador, valor: ValorFichaPrebasica): void {
    const alumno = this.alumnoActual;
    if (!alumno) return;
    const edit = this.editar(alumno);
    if (edit.valores[indicador.id] === valor) delete edit.valores[indicador.id];
    else edit.valores[indicador.id] = valor;
  }

  /** Clic en el encabezado de una columna: marca ese valor en los indicadores del área que siguen vacíos. */
  marcarVaciosDelArea(area: AreaFicha, valor: ValorFichaPrebasica): void {
    const alumno = this.alumnoActual;
    if (!alumno) return;
    const edit = this.editar(alumno);
    area.indicadores.forEach(i => {
      if (!edit.valores[i.id]) edit.valores[i.id] = valor;
    });
  }

  cambiarObservaciones(texto: string): void {
    const alumno = this.alumnoActual;
    if (!alumno) return;
    this.editar(alumno).observaciones = texto;
  }

  limpiarAlumno(): void {
    const alumno = this.alumnoActual;
    if (!alumno || !confirm(`¿Quitar todas las marcas de ${alumno.nombreCompleto}?`)) return;
    this.editar(alumno).valores = {};
  }

  // ── Centro ───────────────────────────────────────────────
  marcarCentroModificado(): void {
    this.centroModificado = true;
  }

  alternarTipoCentro(clave: string): void {
    if (this.tipoCentro.has(clave)) this.tipoCentro.delete(clave);
    else this.tipoCentro.add(clave);
    this.centroModificado = true;
  }

  // ── Guardar ──────────────────────────────────────────────
  get hayCambios(): boolean {
    return this.pendientes.size > 0 || this.centroModificado;
  }

  guardar(): void {
    if (!this.idClase || !this.ficha || !this.hayCambios) return;

    const dto: GuardarFichaPrebasica = {
      guardarCentro: this.centroModificado,
      nombreCentro:  this.nombreCentro.trim() || null,
      municipio:     this.municipio.trim() || null,
      tipoCentro:    TIPOS_CENTRO.filter(t => this.tipoCentro.has(t.clave)).map(t => t.clave).join(',') || null,
      fichas: Array.from(this.pendientes).map(idAlumno => {
        const edit = this.ediciones.get(idAlumno)!;
        return {
          idAlumno,
          observaciones: edit.observaciones.trim() || null,
          valores:       edit.valores,
        };
      }),
    };

    this.guardando = true;
    this.academicoService.guardarFichaPrebasica(this.idClase, dto).subscribe({
      next: (ficha) => {
        this.aplicarFicha(ficha);
        this.guardando = false;
        this.notification.success('Ficha de evaluación guardada');
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err.error?.errores?.mensaje ?? err.error?.mensaje ?? 'No se pudo guardar la ficha');
      }
    });
  }

  // ── Imprimir / PDF ───────────────────────────────────────
  imprimir(todos: boolean): void {
    if (!this.ficha || !this.alumnoActual) return;
    this.alumnosImpresion = todos ? this.ficha.alumnos : [this.alumnoActual];
    // Se espera a que Angular dibuje las hojas antes de abrir el diálogo de impresión.
    setTimeout(() => {
      if (this.impresion) imprimirHojasFicha(this.impresion.nativeElement);
      this.alumnosImpresion = [];
    }, 300);
  }

  trackByAlumno(index: number, a: FichaPrebasicaAlumno): string {
    return a.idAlumno;
  }
}
