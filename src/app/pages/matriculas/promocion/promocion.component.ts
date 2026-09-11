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
  /** Ya promovida: bloqueada para no seleccionarla/editarla y sobreescribir por accidente. */
  bloqueada:           boolean;
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
  filasVisibles: FilaPromocion[] = [];
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
    // Precio de referencia = el vigente al inicio del año lectivo destino.
    this.catalogoService.getGradosConPrecios(`${this.anioDestino}-01-01`).subscribe(d => {
      this.gradosPrecios = d ?? [];
      this.filas.forEach(f => f.mensualidad = this.precioDeGrado(f.idGradoDestino));
    });
    this.matriculaService.listarPromocion(this.anioOrigen).subscribe({
      next: data => {
        this.filas = (data ?? []).map(a => this.aFila(a));
        this.recalcularFilasVisibles();
        this.cargando = false;
      },
      error: () => {
        this.notification.error('No se pudo cargar la lista de promoción.');
        this.cargando = false;
      }
    });
  }

  trackByIdentidad(_index: number, f: FilaPromocion): string {
    return f.identidad;
  }

  private aFila(a: PromocionAlumno): FilaPromocion {
    let resultado: 'Aprobado' | 'Reprobado' = 'Aprobado';
    let idGradoDestino: number | null;
    let seccionDestino: string | null;
    let idNivelInglesDestino: number | null;

    if (a.esUltimoGrado) {
      idGradoDestino = null;
      seccionDestino = a.seccion ?? null;
      idNivelInglesDestino = a.idNivelIngles ?? null;
    } else if (a.yaPromovido) {
      // Ya se proceso: mostrar lo que realmente quedo guardado, no la sugerencia
      // por defecto (si no, al recargar parece que "se olvidó" la decisión tomada).
      resultado = a.estadoFinal === 'Reprobado' ? 'Reprobado' : 'Aprobado';
      idGradoDestino = a.idGradoReal ?? a.idGradoSugerido ?? a.idGradoActual ?? null;
      seccionDestino = a.seccionReal ?? a.seccion ?? null;
      idNivelInglesDestino = a.idNivelInglesReal ?? a.idNivelIngles ?? null;
    } else {
      idGradoDestino = a.idGradoSugerido ?? a.idGradoActual ?? null;
      seccionDestino = a.seccion ?? null;
      idNivelInglesDestino = a.idNivelIngles ?? null;
    }

    return {
      ...a,
      seleccionado: false,
      resultado,
      idGradoDestino,
      seccionDestino,
      idNivelInglesDestino,
      mensualidad: this.precioDeGrado(idGradoDestino),
      bloqueada: a.yaPromovido,
    };
  }

  /** Permite editar y volver a promover una fila ya procesada (corregir un error de captura). */
  desbloquear(fila: FilaPromocion): void {
    if (!confirm(`"${fila.nombreCompleto}" ya fue promovido. Si la volvés a promover se ` +
                 `SOBREESCRIBE su matrícula ${this.anioDestino}. ¿Editar de todos modos?`)) return;
    fila.bloqueada = false;
  }

  private precioDeGrado(idGrado: number | null): number | null {
    if (idGrado == null) return null;
    // Producto 2 = Mensualidad
    const gp = this.gradosPrecios.find(g => g.idGrado === idGrado && g.idProducto === 2);
    return gp ? gp.precio : null;
  }

  // ── filtros / selección ──

  // filasVisibles es un array materializado (no un getter): un getter usado como
  // [dataSource] de mat-table se re-evalua en CADA ciclo de deteccion de cambios
  // y devuelve una referencia nueva aunque el contenido sea el mismo, lo que hace
  // que la tabla destruya y re-cree las celdas (incluidos los mat-button-toggle-group
  // de "Resultado") constantemente — eso puede perder el estado de esos controles.
  recalcularFilasVisibles(): void {
    const nom = this.filtroNombre.trim().toLowerCase();
    this.filasVisibles = this.filas.filter(f =>
      (!nom || f.nombreCompleto.toLowerCase().includes(nom)) &&
      (this.filtroIdGrado == null || f.idGradoActual === this.filtroIdGrado)
    );
  }

  get seleccionadas(): FilaPromocion[] {
    return this.filas.filter(f => f.seleccionado);
  }

  todasVisiblesMarcadas(): boolean {
    const seleccionables = this.filasVisibles.filter(f => !f.bloqueada);
    return seleccionables.length > 0 && seleccionables.every(f => f.seleccionado);
  }

  toggleTodas(check: boolean): void {
    this.filasVisibles.filter(f => !f.bloqueada).forEach(f => f.seleccionado = check);
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
    this.recalcularFilasVisibles();
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

    // Aviso: "Aprobado" pero grado destino = grado actual casi siempre es un error
    // de captura (debería ser "Repite"). No bloquea, pero se confirma antes de mandar.
    const sospechosos = sel.filter(f =>
      !f.esUltimoGrado && f.resultado === 'Aprobado' && f.idGradoDestino === f.idGradoActual);
    if (sospechosos.length &&
        !confirm(`${sospechosos.length} alumno(s) están marcados "Aprobado" pero con el mismo grado ` +
                 `actual como destino (¿debería ser "Repite"?). Revisá: ` +
                 sospechosos.slice(0, 5).map(f => f.nombreCompleto).join(', ') +
                 (sospechosos.length > 5 ? '…' : '') + `. ¿Continuar igual?`)) {
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

    const alumnos: PromoverAlumnoItem[] = sel.map(f => {
      const repite = !f.esUltimoGrado && f.resultado === 'Reprobado';
      // "Repite" siempre = mismo grado, sin depender de que el dropdown se haya sincronizado.
      const idGradoDestino = f.esUltimoGrado
        ? null
        : repite
          ? (f.idGradoActual ?? f.idGradoDestino ?? null)
          : (f.idGradoDestino ?? f.idGradoSugerido ?? null);
      return {
        identidad:            f.identidad,
        promovido:            !repite && !f.esUltimoGrado,
        egresa:               f.esUltimoGrado,
        estadoFinal:          f.esUltimoGrado ? 'Egresado' : (repite ? 'Reprobado' : 'Aprobado'),
        idGradoDestino,
        seccion:              f.esUltimoGrado ? null : f.seccionDestino,
        idNivelInglesDestino: f.esUltimoGrado ? null : f.idNivelInglesDestino,
        // Los precios los define el catalogo por fecha; no se envian desde aqui.
        valorMensualidad:     null,
        valorMatricula:       null,
      };
    });

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
