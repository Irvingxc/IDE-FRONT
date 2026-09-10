import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@app/services';
import {
  MatriculaService, PromocionAlumno, PromocionEstado, PromoverAlumnoItem
} from '@app/services/matricula/matricula.service';
import { CatalogoService, GradoDto, GradoPrecioFlat, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { PromocionConfirmDialogComponent } from './promocion-confirm-dialog.component';

interface FilaPromocion extends PromocionAlumno {
  seleccionado:        boolean;
  resultado:           'Aprobado' | 'Reprobado';
  idGradoDestino:      number | null;
  seccionDestino:      string | null;
  idNivelInglesDestino: number | null;
  mensualidad:         number | null;
}

@Component({
  selector: 'app-promocion',
  templateUrl: './promocion.component.html',
  styleUrls: ['./promocion.component.scss']
})
export class PromocionComponent implements OnInit {

  columnas = ['sel', 'alumno', 'gradoActual', 'resultado', 'gradoDestino', 'seccion', 'nivelIngles', 'mensualidad'];

  anioOrigen = new Date().getFullYear();
  get anioDestino(): number { return this.anioOrigen + 1; }
  aniosDisponibles: number[] = [];

  filas: FilaPromocion[] = [];
  cargando = false;
  promoviendo = false;
  estado: PromocionEstado | null = null;

  grados: GradoDto[] = [];
  gradosPrecios: GradoPrecioFlat[] = [];
  niveles: NivelIngles[] = [];
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  filtroNombre = '';
  filtroIdGrado: number | null = null;

  constructor(
    private matriculaService: MatriculaService,
    private catalogoService: CatalogoService,
    private notification: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const anio = new Date().getFullYear();
    this.aniosDisponibles = [anio - 2, anio - 1, anio, anio + 1];

    this.catalogoService.getGrados().subscribe(d => this.grados = d ?? []);
    this.catalogoService.getGradosConPrecios().subscribe(d => this.gradosPrecios = d ?? []);
    this.catalogoService.getNivelesIngles().subscribe(d => this.niveles = d ?? []);

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.filas = [];
    this.matriculaService.estadoPromocion(this.anioOrigen).subscribe({
      next: e => this.estado = e,
      error: () => this.estado = null
    });
    this.matriculaService.listarPromocion(this.anioOrigen).subscribe({
      next: data => {
        this.filas = (data ?? []).map(a => this.aFila(a));
        this.cargando = false;
      },
      error: () => {
        this.notification.error('No se pudo cargar la lista de promoción.');
        this.cargando = false;
      }
    });
  }

  private aFila(a: PromocionAlumno): FilaPromocion {
    const idGradoDestino = a.esUltimoGrado ? null : (a.idGradoSugerido ?? a.idGradoActual ?? null);
    return {
      ...a,
      seleccionado:         false,
      resultado:            'Aprobado',
      idGradoDestino,
      seccionDestino:       a.seccion ?? null,
      idNivelInglesDestino: a.idNivelIngles ?? null,
      mensualidad:          this.precioDeGrado(idGradoDestino),
    };
  }

  private precioDeGrado(idGrado: number | null): number | null {
    if (idGrado == null) return null;
    const gp = this.gradosPrecios.find(g => g.idGrado === idGrado);
    return gp ? gp.precio : null;
  }

  // ── filtros / selección ──

  get filasVisibles(): FilaPromocion[] {
    const nom = this.filtroNombre.trim().toLowerCase();
    return this.filas.filter(f =>
      (!nom || f.nombreCompleto.toLowerCase().includes(nom)) &&
      (this.filtroIdGrado == null || f.idGradoActual === this.filtroIdGrado)
    );
  }

  get seleccionadas(): FilaPromocion[] {
    return this.filas.filter(f => f.seleccionado);
  }

  todasVisiblesMarcadas(): boolean {
    const v = this.filasVisibles;
    return v.length > 0 && v.every(f => f.seleccionado);
  }

  toggleTodas(check: boolean): void {
    this.filasVisibles.forEach(f => f.seleccionado = check);
  }

  onResultadoChange(fila: FilaPromocion): void {
    if (fila.resultado === 'Reprobado' && !fila.esUltimoGrado) {
      // Repite: grado destino = grado actual
      fila.idGradoDestino = fila.idGradoActual ?? null;
      fila.mensualidad = this.precioDeGrado(fila.idGradoDestino);
    } else if (fila.resultado === 'Aprobado' && !fila.esUltimoGrado) {
      fila.idGradoDestino = fila.idGradoSugerido ?? fila.idGradoActual ?? null;
      fila.mensualidad = this.precioDeGrado(fila.idGradoDestino);
    }
  }

  onGradoDestinoChange(fila: FilaPromocion): void {
    fila.mensualidad = this.precioDeGrado(fila.idGradoDestino);
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroIdGrado = null;
  }

  // ── ejecutar ──

  promover(): void {
    const sel = this.seleccionadas;
    if (!sel.length) return;

    const invalidas = sel.filter(f => !f.esUltimoGrado && f.idGradoDestino == null);
    if (invalidas.length) {
      this.notification.error('Hay alumnos seleccionados sin grado destino.');
      return;
    }

    const egresan = sel.filter(f => f.esUltimoGrado).length;

    const ref = this.dialog.open(PromocionConfirmDialogComponent, {
      width: '440px',
      data: {
        total: sel.length,
        egresan,
        anioOrigen: this.anioOrigen,
        anioDestino: this.anioDestino,
      }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.ejecutar(sel);
    });
  }

  private ejecutar(sel: FilaPromocion[]): void {
    this.promoviendo = true;

    const alumnos: PromoverAlumnoItem[] = sel.map(f => ({
      identidad:            f.identidad,
      promovido:            f.resultado === 'Aprobado',
      egresa:               f.esUltimoGrado,
      estadoFinal:          f.esUltimoGrado ? 'Egresado' : f.resultado,
      idGradoDestino:       f.esUltimoGrado ? null : f.idGradoDestino,
      seccion:              f.esUltimoGrado ? null : f.seccionDestino,
      idNivelInglesDestino: f.esUltimoGrado ? null : f.idNivelInglesDestino,
      valorMensualidad:     f.esUltimoGrado ? null : f.mensualidad,
      valorMatricula:       null,
    }));

    this.matriculaService.promover({
      anioOrigen:  this.anioOrigen,
      anioDestino: this.anioDestino,
      alumnos,
    }).subscribe({
      next: r => {
        this.promoviendo = false;
        this.notification.success(
          `Promoción aplicada: ${r.promovidos} alumno(s) al año ${this.anioDestino}` +
          (r.egresados ? `, ${r.egresados} egresado(s)` : '') + '.'
        );
        this.cargar();
      },
      error: err => {
        this.promoviendo = false;
        const msg = err?.error?.errores?.mensaje ?? err?.error?.mensaje ?? 'No se pudo aplicar la promoción.';
        this.notification.error(msg);
      }
    });
  }
}
