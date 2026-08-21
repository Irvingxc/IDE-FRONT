import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import { AcademicoService, PeriodoResponse, ClaseResponse, SemanaResponse, EvaluacionResponse, ConceptoPrincipal, Actividad, GuardarConceptoPrincipalItem, ActividadNombreClaseItem, AlumnoNotaActividad, GuardarNotaActividadItem } from '@app/services/academico/academico.service';
import { CatalogoService, GradoDto, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PeriodoDialogComponent } from './periodo-dialog/periodo-dialog.component';
import { ClaseDialogComponent } from './clase-dialog/clase-dialog.component';
import { EvaluacionDialogComponent } from './evaluacion-dialog/evaluacion-dialog.component';
import { NotasDialogComponent } from './notas-dialog/notas-dialog.component';
import { NivelInglesDialogComponent } from './nivel-ingles-dialog/nivel-ingles-dialog.component';

interface ActividadRow {
  id:         number | null;
  nombre:     string;
  porcentaje: number | null;
}

interface ConceptoPrincipalRow {
  id:          number | null;
  nombre:      string;
  actividades: ActividadRow[];
}

interface GrupoClase {
  tipo:   'grado' | 'nivel';
  id:     number;
  nombre: string;
}

@Component({
  selector: 'app-academico',
  templateUrl: './academico.component.html',
  styleUrls: ['./academico.component.scss']
})
export class AcademicoComponent implements OnInit {
  anioLectivo = new Date().getFullYear();

  periodos: PeriodoResponse[] = [];
  loadingPeriodos = true;
  columnasPeriodos = ['nombre', 'fechaDesde', 'fechaHasta', 'anioLectivo', 'acciones'];

  clases: ClaseResponse[] = [];
  loadingClases = true;
  columnasClases = ['nombre', 'gradoNombre', 'seccion', 'maestroNombre', 'acciones'];

  // ── Notas ─────────────────────────────────────────────────
  notasSimpleIdClase: number | null = null;
  notasSimpleIdPeriodo: number | null = null;
  estructuraNotas: ConceptoPrincipal[] = [];
  alumnosNotas: AlumnoNotaActividad[] = [];
  loadingAlumnosNotas = false;
  guardandoNotas = false;
  hayCambiosNotas = false;
  private nombresActividadOriginal: { [idActividad: number]: string } = {};

  marcarCambioNotas(): void {
    this.hayCambiosNotas = true;
  }

  get actividadesPlanas(): Actividad[] {
    return this.estructuraNotas.flatMap(c => c.actividades);
  }

  sumaPorcentajes(actividades: Actividad[]): number {
    return actividades.reduce((s, a) => s + a.porcentaje, 0);
  }

  totalAlumno(alumno: AlumnoNotaActividad): number {
    let total = 0;
    for (const a of this.actividadesPlanas) {
      total += alumno.notas[a.id] ?? 0;
    }
    return Math.round(total * 100) / 100;
  }

  esAdmin = false;
  soloMaestro = false;
  idUsuarioActual: string | null = null;

  get clasesDisponiblesNotas(): ClaseResponse[] {
    if (this.esAdmin) return this.clases;
    return this.clases.filter(c => c.idMaestro === this.idUsuarioActual);
  }

  // ── Buscadores en cascada (Clase → Grado → Sección → Periodo) ──
  notasMateriaBusqueda = '';
  notasMateriaSeleccionada: string | null = null;

  notasGradoBusqueda = '';
  notasGradoId: number | null = null;

  notasSeccionBusqueda = '';
  notasSeccion: string | null = null;

  periodoBusqueda = '';

  get materiasDisponibles(): string[] {
    const nombres = this.clasesDisponiblesNotas.map(c => c.nombre);
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }

  get materiasFiltradas(): string[] {
    const term = this.notasMateriaBusqueda.trim().toLowerCase();
    if (!term) return this.materiasDisponibles;
    return this.materiasDisponibles.filter(n => n.toLowerCase().includes(term));
  }

  notasGradoTipo: 'grado' | 'nivel' | null = null;

  get gruposDeMateria(): GrupoClase[] {
    if (!this.notasMateriaSeleccionada) return [];
    const vistos = new Map<string, GrupoClase>();
    this.clasesDisponiblesNotas
      .filter(c => c.nombre === this.notasMateriaSeleccionada)
      .forEach(c => {
        if (c.idGrado != null && c.gradoNombre != null) {
          vistos.set('g' + c.idGrado, { tipo: 'grado', id: c.idGrado, nombre: c.gradoNombre });
        } else if (c.idNivelIngles != null && c.nivelInglesNombre != null) {
          vistos.set('n' + c.idNivelIngles, { tipo: 'nivel', id: c.idNivelIngles, nombre: c.nivelInglesNombre });
        }
      });
    return Array.from(vistos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get gruposDeMateriaFiltrados(): GrupoClase[] {
    const term = this.notasGradoBusqueda.trim().toLowerCase();
    if (!term) return this.gruposDeMateria;
    return this.gruposDeMateria.filter(g => g.nombre.toLowerCase().includes(term));
  }

  trackByGrupo(index: number, g: GrupoClase): string {
    return g.tipo + g.id;
  }

  get seccionesDeClase(): string[] {
    if (!this.notasMateriaSeleccionada || !this.notasGradoId || !this.notasGradoTipo) return [];
    const secciones = this.clasesDisponiblesNotas
      .filter(c => c.nombre === this.notasMateriaSeleccionada &&
        (this.notasGradoTipo === 'grado' ? c.idGrado === this.notasGradoId : c.idNivelIngles === this.notasGradoId))
      .map(c => c.seccion);
    return Array.from(new Set(secciones)).sort();
  }

  get seccionesDeClaseFiltradas(): string[] {
    const term = this.notasSeccionBusqueda.trim().toLowerCase();
    if (!term) return this.seccionesDeClase;
    return this.seccionesDeClase.filter(s => s.toLowerCase().includes(term));
  }

  get periodosFiltrados(): PeriodoResponse[] {
    const term = this.periodoBusqueda.trim().toLowerCase();
    if (!term) return this.periodos;
    return this.periodos.filter(p => p.nombre.toLowerCase().includes(term));
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    // El click que da el foco también dispara un mouseup nativo que colapsa la selección;
    // se difiere al siguiente ciclo para que el select() sobreviva a ese mouseup.
    setTimeout(() => input.select(), 0);
  }

  bloquearTeclaNoNumerica(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) return;

    const teclasPermitidas = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', '.'];
    if (teclasPermitidas.includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  bloquearPegadoNoNumerico(event: ClipboardEvent): void {
    const texto = event.clipboardData?.getData('text') ?? '';
    if (!/^\d*\.?\d*$/.test(texto)) event.preventDefault();
  }

  onFocusMateria(): void {
    this.cargarClases();
  }

  onFocusPeriodo(): void {
    this.cargarPeriodos();
  }

  onMateriaSeleccionada(nombre: string): void {
    this.notasMateriaSeleccionada = nombre;
    this.notasMateriaBusqueda = nombre;

    this.notasGradoId = null;
    this.notasGradoTipo = null;
    this.notasGradoBusqueda = '';
    this.notasSeccion = null;
    this.notasSeccionBusqueda = '';

    this.notasSimpleIdClase = null;
    this.onNotasSimpleFiltroChange();
  }

  onGrupoDeMateriaSeleccionado(grupo: GrupoClase): void {
    this.notasGradoId = grupo.id;
    this.notasGradoTipo = grupo.tipo;
    this.notasGradoBusqueda = grupo.nombre;

    this.notasSeccion = null;
    this.notasSeccionBusqueda = '';

    this.notasSimpleIdClase = null;
    this.onNotasSimpleFiltroChange();
  }

  onSeccionDeClaseSeleccionada(seccion: string): void {
    this.notasSeccion = seccion;
    this.notasSeccionBusqueda = seccion;

    const clase = this.clasesDisponiblesNotas.find(c =>
      c.nombre === this.notasMateriaSeleccionada &&
      (this.notasGradoTipo === 'grado' ? c.idGrado === this.notasGradoId : c.idNivelIngles === this.notasGradoId) &&
      c.seccion === seccion
    );
    this.notasSimpleIdClase = clase ? clase.id : null;
    this.onNotasSimpleFiltroChange();
  }

  onPeriodoSeleccionadoNotas(periodo: PeriodoResponse): void {
    this.notasSimpleIdPeriodo = periodo.id;
    this.periodoBusqueda = periodo.nombre;
    this.onNotasSimpleFiltroChange();
  }

  // ── Notas detalladas ──────────────────────────────────────
  notasIdClase: number | null = null;
  notasIdPeriodo: number | null = null;
  semanas: SemanaResponse[] = [];
  evaluacionesPorSemana: { [idSemana: number]: EvaluacionResponse[] } = {};
  loadingSemanas = false;

  // ── Grados / conceptos de evaluación ───────────────────────
  tipoEstructura: 'grado' | 'nivel' = 'grado';

  grados: GradoDto[] = [];
  gradoSeleccionadoId: number | null = null;
  gradoBusqueda = '';

  niveles: NivelIngles[] = [];
  nivelSeleccionadoId: number | null = null;
  nivelBusqueda = '';

  conceptosPrincipales: ConceptoPrincipalRow[] = [];
  loadingConceptos = false;
  guardandoConceptos = false;

  get totalPorcentajeConceptos(): number {
    return this.conceptosPrincipales.reduce((sum, c) =>
      sum + c.actividades.reduce((s2, a) => s2 + (a.porcentaje || 0), 0), 0);
  }

  subtotalConcepto(concepto: ConceptoPrincipalRow): number {
    return concepto.actividades.reduce((s, a) => s + (a.porcentaje || 0), 0);
  }

  get gradosFiltrados(): GradoDto[] {
    const term = this.gradoBusqueda.trim().toLowerCase();
    if (!term) return this.grados;
    return this.grados.filter(g => g.gradoNombre.toLowerCase().includes(term));
  }

  get nivelesFiltrados(): NivelIngles[] {
    const term = this.nivelBusqueda.trim().toLowerCase();
    if (!term) return this.niveles;
    return this.niveles.filter(n => n.nombre.toLowerCase().includes(term));
  }

  onTipoEstructuraChange(): void {
    this.gradoSeleccionadoId = null;
    this.gradoBusqueda = '';
    this.nivelSeleccionadoId = null;
    this.nivelBusqueda = '';
    this.conceptosPrincipales = [];
  }

  onFocusGrado(): void {
    this.cargarGrados();
  }

  onFocusNivel(): void {
    this.cargarNiveles();
  }

  onGradoSeleccionadoAutocomplete(grado: GradoDto): void {
    this.gradoSeleccionadoId = grado.idGrado;
    this.gradoBusqueda = grado.gradoNombre;
    this.cargarEstructura();
  }

  onNivelSeleccionadoAutocomplete(nivel: NivelIngles): void {
    this.nivelSeleccionadoId = nivel.id;
    this.nivelBusqueda = nivel.nombre;
    this.cargarEstructura();
  }

  nuevoNivelDesdeGrados(): void {
    const ref = this.dialog.open(NivelInglesDialogComponent, { width: '400px', data: {} });
    ref.afterClosed().subscribe((nivel: NivelIngles | null) => {
      if (nivel) {
        this.cargarNiveles();
        this.onNivelSeleccionadoAutocomplete(nivel);
      }
    });
  }

  constructor(
    private academicoService: AcademicoService,
    private catalogoService: CatalogoService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private store: Store<fromRoot.State>
  ) {}

  ngOnInit(): void {
    this.store.pipe(select(fromUser.getUserState)).subscribe(u => {
      const roles: string[] = (u?.entity as any)?.roles ?? [];
      this.esAdmin = roles.some((r: string) => r === 'Administrador' || r === 'Director');
      this.soloMaestro = !this.esAdmin && roles.includes('Maestro');
      this.idUsuarioActual = (u?.entity as any)?.id != null ? String((u?.entity as any).id) : null;
    });
    this.cargarPeriodos();
    this.cargarClases();
    this.cargarGrados();
    this.cargarNiveles();
  }

  cargarGrados(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
  }

  cargarNiveles(): void {
    this.catalogoService.getNivelesIngles().subscribe(n => this.niveles = n);
  }

  // ── Periodos ──────────────────────────────────────────────
  cargarPeriodos(): void {
    this.loadingPeriodos = true;
    this.academicoService.listarPeriodos(this.anioLectivo).subscribe({
      next: (data) => { this.periodos = data; this.loadingPeriodos = false; },
      error: () => { this.loadingPeriodos = false; }
    });
  }

  nuevoPeriodo(): void {
    const ref = this.dialog.open(PeriodoDialogComponent, {
      width: '460px',
      data: { anioLectivo: this.anioLectivo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarPeriodos(); });
  }

  editarPeriodo(periodo: PeriodoResponse): void {
    const ref = this.dialog.open(PeriodoDialogComponent, {
      width: '460px',
      data: { periodo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarPeriodos(); });
  }

  inactivarPeriodo(periodo: PeriodoResponse): void {
    if (!confirm(`¿Inactivar el periodo "${periodo.nombre}"?`)) return;
    this.academicoService.inactivarPeriodo(periodo.id).subscribe({
      next: () => {
        this.notification.success('Periodo inactivado correctamente');
        this.cargarPeriodos();
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar el periodo');
      }
    });
  }

  bloquearPeriodo(periodo: PeriodoResponse): void {
    const accion = periodo.bloqueado ? 'desbloquear' : 'bloquear';
    const mensaje = periodo.bloqueado
      ? `¿Desbloquear el periodo "${periodo.nombre}"? Los maestros podrán volver a editar notas de este periodo.`
      : `¿Bloquear el periodo "${periodo.nombre}"? Nadie podrá editar notas de este periodo hasta que lo desbloquees.`;
    if (!confirm(mensaje)) return;

    this.academicoService.bloquearPeriodo(periodo.id, !periodo.bloqueado).subscribe({
      next: () => {
        this.notification.success(`Periodo ${periodo.bloqueado ? 'desbloqueado' : 'bloqueado'} correctamente`);
        this.cargarPeriodos();
      },
      error: (err) => {
        this.notification.error(err.error?.errores?.mensaje ?? `Error al ${accion} el periodo`);
      }
    });
  }

  // ── Clases ────────────────────────────────────────────────
  cargarClases(): void {
    this.loadingClases = true;
    this.academicoService.listarClases(this.anioLectivo).subscribe({
      next: (data) => { this.clases = data; this.loadingClases = false; },
      error: () => { this.loadingClases = false; }
    });
  }

  nuevaClase(): void {
    const ref = this.dialog.open(ClaseDialogComponent, {
      width: '460px',
      data: { anioLectivo: this.anioLectivo }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarClases(); });
  }

  editarClase(clase: ClaseResponse): void {
    const ref = this.dialog.open(ClaseDialogComponent, {
      width: '460px',
      data: { clase }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarClases(); });
  }

  inactivarClase(clase: ClaseResponse): void {
    if (!confirm(`¿Inactivar la clase "${clase.nombre}"?`)) return;
    this.academicoService.inactivarClase(clase.id).subscribe({
      next: () => {
        this.notification.success('Clase inactivada correctamente');
        this.cargarClases();
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar la clase');
      }
    });
  }

  // ── Notas ─────────────────────────────────────────────────
  onNotasFiltroChange(): void {
    this.semanas = [];
    this.evaluacionesPorSemana = {};
    if (!this.notasIdClase || !this.notasIdPeriodo) return;

    this.loadingSemanas = true;
    this.academicoService.listarSemanas(this.notasIdPeriodo).subscribe({
      next: (data) => {
        this.semanas = data;
        this.loadingSemanas = false;
        this.semanas.forEach(s => this.cargarEvaluaciones(s.id));
      },
      error: () => { this.loadingSemanas = false; }
    });
  }

  cargarEvaluaciones(idSemana: number): void {
    if (!this.notasIdClase) return;
    this.academicoService.listarEvaluaciones(this.notasIdClase, idSemana).subscribe(data => {
      this.evaluacionesPorSemana[idSemana] = data;
    });
  }

  nuevaEvaluacion(semana: SemanaResponse): void {
    if (!this.notasIdClase) return;
    const ref = this.dialog.open(EvaluacionDialogComponent, {
      width: '400px',
      data: { idSemana: semana.id, idClase: this.notasIdClase }
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarEvaluaciones(semana.id); });
  }

  abrirNotas(evaluacion: EvaluacionResponse): void {
    this.dialog.open(NotasDialogComponent, {
      width: '600px',
      data: { evaluacion }
    });
  }

  inactivarEvaluacion(evaluacion: EvaluacionResponse): void {
    if (!confirm(`¿Inactivar la evaluación "${evaluacion.nombre}"?`)) return;
    this.academicoService.inactivarEvaluacion(evaluacion.id).subscribe({
      next: () => {
        this.notification.success('Evaluación inactivada correctamente');
        this.cargarEvaluaciones(evaluacion.idSemana);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al inactivar la evaluación');
      }
    });
  }

  onNotasSimpleFiltroChange(): void {
    this.estructuraNotas = [];
    this.alumnosNotas = [];
    this.nombresActividadOriginal = {};
    this.hayCambiosNotas = false;
    if (!this.notasSimpleIdClase || !this.notasSimpleIdPeriodo) return;

    const idClase = this.notasSimpleIdClase;
    const idPeriodo = this.notasSimpleIdPeriodo;

    this.loadingAlumnosNotas = true;
    forkJoin({
      estructura: this.academicoService.listarEstructuraClase(idClase, idPeriodo),
      alumnos: this.academicoService.listarAlumnosNotasActividad(idClase, idPeriodo)
    }).subscribe({
      next: ({ estructura, alumnos }) => {
        this.estructuraNotas = estructura;
        this.alumnosNotas = alumnos;
        estructura.forEach(c => c.actividades.forEach(a => this.nombresActividadOriginal[a.id] = a.nombre));
        this.loadingAlumnosNotas = false;
      },
      error: () => { this.loadingAlumnosNotas = false; }
    });
  }

  guardarNotasActividad(): void {
    if (!this.notasSimpleIdClase || !this.notasSimpleIdPeriodo) return;
    const idClase = this.notasSimpleIdClase;
    const idPeriodo = this.notasSimpleIdPeriodo;

    const renombres: ActividadNombreClaseItem[] = this.actividadesPlanas
      .filter(a => this.nombresActividadOriginal[a.id] !== a.nombre)
      .map(a => ({ idActividad: a.id, nombre: a.nombre }));

    const notas: GuardarNotaActividadItem[] = [];
    for (const alumno of this.alumnosNotas) {
      for (const a of this.actividadesPlanas) {
        notas.push({ idAlumno: alumno.idAlumno, idActividad: a.id, nota: alumno.notas[a.id] ?? null });
      }
    }

    this.guardandoNotas = true;

    const guardarNotas = (): void => {
      this.academicoService.guardarNotasActividad(idClase, idPeriodo, notas).subscribe({
        next: () => {
          this.guardandoNotas = false;
          this.hayCambiosNotas = false;
          this.notification.success('Notas guardadas correctamente');
          this.actividadesPlanas.forEach(a => this.nombresActividadOriginal[a.id] = a.nombre);
        },
        error: (err) => {
          this.guardandoNotas = false;
          this.notification.error(err.error?.errores?.mensaje ?? 'Error al guardar las notas');
        }
      });
    };

    if (renombres.length > 0) {
      this.academicoService.guardarActividadesNombreClase(idClase, renombres).subscribe({
        next: () => guardarNotas(),
        error: (err) => {
          this.guardandoNotas = false;
          this.notification.error(err.error?.errores ?? 'Error al guardar los nombres de actividad');
        }
      });
    } else {
      guardarNotas();
    }
  }

  // ── Grados / conceptos de evaluación ───────────────────────
  private mapArbolAFilas(data: ConceptoPrincipal[]): ConceptoPrincipalRow[] {
    return data.map(c => ({
      id: c.id,
      nombre: c.nombre,
      actividades: c.actividades.map(a => ({ id: a.id, nombre: a.nombre, porcentaje: a.porcentaje }))
    }));
  }

  cargarEstructura(): void {
    this.conceptosPrincipales = [];
    const idGrado = this.tipoEstructura === 'grado' ? this.gradoSeleccionadoId : null;
    const idNivelIngles = this.tipoEstructura === 'nivel' ? this.nivelSeleccionadoId : null;
    if (!idGrado && !idNivelIngles) return;

    this.loadingConceptos = true;
    this.academicoService.listarConceptosConActividades(idGrado, idNivelIngles).subscribe({
      next: (data) => {
        this.conceptosPrincipales = this.mapArbolAFilas(data);
        this.loadingConceptos = false;
      },
      error: () => { this.loadingConceptos = false; }
    });
  }

  agregarConceptoPrincipal(): void {
    this.conceptosPrincipales.push({ id: null, nombre: '', actividades: [] });
  }

  quitarConceptoPrincipal(index: number): void {
    this.conceptosPrincipales.splice(index, 1);
  }

  agregarActividad(concepto: ConceptoPrincipalRow): void {
    concepto.actividades.push({ id: null, nombre: '', porcentaje: null });
  }

  quitarActividad(concepto: ConceptoPrincipalRow, index: number): void {
    concepto.actividades.splice(index, 1);
  }

  guardarConceptos(): void {
    const idGrado = this.tipoEstructura === 'grado' ? this.gradoSeleccionadoId : null;
    const idNivelIngles = this.tipoEstructura === 'nivel' ? this.nivelSeleccionadoId : null;
    if (!idGrado && !idNivelIngles) return;

    if (this.conceptosPrincipales.length === 0) {
      this.notification.error('Agrega al menos un concepto principal');
      return;
    }
    if (this.conceptosPrincipales.some(c => !c.nombre.trim())) {
      this.notification.error('Todos los conceptos principales deben tener un nombre');
      return;
    }
    if (this.conceptosPrincipales.some(c => c.actividades.length === 0)) {
      this.notification.error('Cada concepto principal debe tener al menos una actividad');
      return;
    }
    if (this.conceptosPrincipales.some(c => c.actividades.some(a => !a.nombre.trim()))) {
      this.notification.error('Todas las actividades deben tener un nombre');
      return;
    }
    if (this.totalPorcentajeConceptos !== 100) {
      this.notification.error('Los porcentajes de todas las actividades deben sumar exactamente 100%');
      return;
    }

    const dto: GuardarConceptoPrincipalItem[] = this.conceptosPrincipales.map((c, i) => ({
      id: c.id,
      nombre: c.nombre.trim(),
      orden: i,
      actividades: c.actividades.map((a, j) => ({ id: a.id, nombre: a.nombre.trim(), porcentaje: a.porcentaje ?? 0, orden: j }))
    }));

    this.guardandoConceptos = true;
    this.academicoService.guardarConceptosConActividades(idGrado, idNivelIngles, dto).subscribe({
      next: (data) => {
        this.conceptosPrincipales = this.mapArbolAFilas(data);
        this.guardandoConceptos = false;
        this.notification.success('Estructura de conceptos y actividades guardada correctamente');
      },
      error: (err) => {
        this.guardandoConceptos = false;
        this.notification.error(err.error?.errores ?? 'Error al guardar la estructura');
      }
    });
  }
}
