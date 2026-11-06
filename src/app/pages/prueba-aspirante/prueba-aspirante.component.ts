import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { concatMap, finalize } from 'rxjs/operators';
import {
  PruebaPublica, PruebasAspirantesService, formatoCodigo
} from '@app/services/pruebas-aspirantes/pruebas-aspirantes.service';

interface Pregunta {
  numero:    number;
  opciones:  string[];
  respuesta: string | null;
}

/**
 * Hoja de respuestas del aspirante (pagina publica, sin sesion). El aspirante
 * lee el cuadernillo impreso y aqui solo marca la letra. Cada clic se guarda en
 * el servidor; el tiempo lo controla el servidor.
 */
@Component({
  selector: 'app-prueba-aspirante',
  templateUrl: './prueba-aspirante.component.html',
  styleUrls: ['./prueba-aspirante.component.scss']
})
export class PruebaAspiranteComponent implements OnInit, OnDestroy {

  codigoIngresado = '';
  codigo: string | null = null;

  prueba: PruebaPublica | null = null;
  preguntas: Pregunta[] = [];
  /**
   * Distribucion de la hoja impresa: tres columnas (1-27, 28-54, 55-80) partidas
   * en un bloque superior y uno inferior por la franja "ASEGURESE...".
   * Cada fila trae las preguntas de las tres columnas (null = celda vacia).
   */
  bloqueSuperior: (Pregunta | null)[][] = [];
  bloqueInferior: (Pregunta | null)[][] = [];
  cargando = false;
  iniciando = false;
  terminando = false;
  mensajeError: string | null = null;
  /** Mensaje de cierre: 'enviada' o 'tiempo'. */
  cierre: 'enviada' | 'tiempo' | null = null;

  segundosRestantes = 0;
  private finTiempo = 0;           // Date.now() en que se acaba el tiempo segun el servidor
  private reloj?: ReturnType<typeof setInterval>;

  private cola = new Subject<{ numero: number; respuesta: string | null }>();
  private colaSub?: Subscription;
  pendientes = 0;

  readonly formatoCodigo = formatoCodigo;

  constructor(
    private svc: PruebasAspirantesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Las respuestas se guardan una tras otra, en el orden de los clics
    this.colaSub = this.cola.pipe(
      concatMap(r => this.svc.responderPublica(this.codigo!, r.numero, r.respuesta).pipe(
        finalize(() => this.pendientes--)
      ))
    ).subscribe({
      error: (err: HttpErrorResponse) => this.errorAlGuardar(err)
    });

    this.route.paramMap.subscribe(p => {
      const codigo = p.get('codigo');
      if (codigo) {
        this.codigo = codigo.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        this.cargar();
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerReloj();
    this.colaSub?.unsubscribe();
  }

  // ----- Codigo -----

  abrirCodigo(): void {
    const limpio = this.codigoIngresado.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (limpio.length !== 8) {
      this.mensajeError = 'El código tiene 8 caracteres (por ejemplo K7PQ-42XM).';
      return;
    }
    this.router.navigate(['/prueba', limpio]);
  }

  // ----- Carga y estado -----

  cargar(): void {
    if (!this.codigo) return;
    this.cargando = true;
    this.mensajeError = null;
    this.svc.obtenerPublica(this.codigo).subscribe({
      next: p => { this.aplicar(p); this.cargando = false; },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.prueba = null;
        this.mensajeError = err?.error?.errores?.mensaje ?? 'No se pudo abrir la prueba. Revisa la conexión e inténtalo de nuevo.';
      }
    });
  }

  private aplicar(p: PruebaPublica): void {
    const estabaEnCurso = this.prueba?.estado === 'En curso';
    this.prueba = p;
    this.preguntas = p.preguntas.map(x => ({
      numero: x.numero,
      opciones: x.opciones.split(''),
      respuesta: x.respuesta
    }));
    this.armarHoja();

    if (p.estado === 'En curso' && p.segundosRestantes != null) {
      this.finTiempo = Date.now() + p.segundosRestantes * 1000;
      this.iniciarReloj();
    } else {
      this.detenerReloj();
      if (estabaEnCurso && p.estado === 'Terminada' && !this.cierre) this.cierre = 'tiempo';
    }
  }

  private armarHoja(): void {
    const total = this.preguntas.length;
    const porColumna = Math.ceil(total / 3);            // 27 en el OTIS Gamma
    const filasArriba = Math.floor(porColumna / 2);     // 13 arriba, 14 abajo
    const porNumero = new Map(this.preguntas.map(p => [p.numero, p]));
    const filas = (desde: number, cuantas: number) =>
      Array.from({ length: cuantas }, (_, i) =>
        [0, 1, 2].map(c => {
          const n = c * porColumna + desde + i;
          return n <= Math.min(total, (c + 1) * porColumna) ? porNumero.get(n) ?? null : null;
        }));
    this.bloqueSuperior = filas(1, filasArriba);
    this.bloqueInferior = filas(filasArriba + 1, porColumna - filasArriba);
  }

  comenzar(): void {
    if (!this.codigo || this.iniciando) return;
    this.iniciando = true;
    this.svc.iniciarPublica(this.codigo).subscribe({
      next: p => { this.iniciando = false; this.aplicar(p); },
      error: (err: HttpErrorResponse) => {
        this.iniciando = false;
        this.mensajeError = err?.error?.errores?.mensaje ?? 'No se pudo comenzar la prueba.';
        this.cargar();
      }
    });
  }

  // ----- Reloj (referencia: el servidor) -----

  private iniciarReloj(): void {
    this.detenerReloj();
    this.tic();
    this.reloj = setInterval(() => this.tic(), 1000);
  }

  private detenerReloj(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = undefined;
  }

  private tic(): void {
    this.segundosRestantes = Math.max(0, Math.round((this.finTiempo - Date.now()) / 1000));
    if (this.segundosRestantes === 0) {
      this.detenerReloj();
      // El servidor califica la prueba al consultarla con el tiempo vencido
      setTimeout(() => this.cargar(), 1500);
    }
  }

  get reloj_texto(): string {
    const m = Math.floor(this.segundosRestantes / 60);
    const s = this.segundosRestantes % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get poco_tiempo(): boolean {
    return this.segundosRestantes <= 300;
  }

  // ----- Respuestas -----

  marcar(p: Pregunta, letra: string): void {
    if (this.prueba?.estado !== 'En curso' || this.segundosRestantes === 0) return;
    // Clic en la letra ya marcada = borrar la respuesta
    p.respuesta = p.respuesta === letra ? null : letra;
    this.pendientes++;
    this.cola.next({ numero: p.numero, respuesta: p.respuesta });
  }

  private errorAlGuardar(err: HttpErrorResponse): void {
    // La cola se cierra con el error: se vuelve a abrir y se recarga lo que el
    // servidor tiene guardado.
    this.pendientes = 0;
    this.colaSub = this.cola.pipe(
      concatMap(r => this.svc.responderPublica(this.codigo!, r.numero, r.respuesta).pipe(
        finalize(() => this.pendientes--)
      ))
    ).subscribe({ error: (e: HttpErrorResponse) => this.errorAlGuardar(e) });

    this.mensajeError = err.status === 409
      ? null
      : (err?.error?.errores?.mensaje ?? 'No se pudo guardar una respuesta. Revisa la conexión: se muestran las respuestas guardadas.');
    this.cargar();
  }

  get respondidas(): number {
    return this.preguntas.filter(p => !!p.respuesta).length;
  }

  terminar(): void {
    if (!this.codigo || this.terminando || this.pendientes > 0) return;
    const sinResponder = this.preguntas.length - this.respondidas;
    const aviso = sinResponder > 0
      ? `Te faltan ${sinResponder} pregunta(s) sin responder.\n\n¿Terminar y enviar la prueba? Ya no podrás cambiar respuestas.`
      : '¿Terminar y enviar la prueba? Ya no podrás cambiar respuestas.';
    if (!confirm(aviso)) return;

    this.terminando = true;
    this.svc.terminarPublica(this.codigo).subscribe({
      next: () => {
        this.terminando = false;
        this.cierre = 'enviada';
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.terminando = false;
        this.mensajeError = err?.error?.errores?.mensaje ?? 'No se pudo enviar la prueba. Inténtalo de nuevo.';
        this.cargar();
      }
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // ----- Avisos del navegador -----

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    if (document.visibilityState === 'hidden' && this.prueba?.estado === 'En curso' && this.codigo) {
      this.svc.registrarSalidaPublica(this.codigo).subscribe({ error: () => {} });
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  antesDeSalir(e: BeforeUnloadEvent): void {
    if (this.prueba?.estado === 'En curso') {
      e.preventDefault();
      e.returnValue = '';
    }
  }
}
