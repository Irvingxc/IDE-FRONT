import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { NotificationService } from '@app/services';
import { TokenService } from '@app/services/token/token.service';
import {
  PruebaAspirante, PruebasAspirantesService, formatoCodigo
} from '@app/services/pruebas-aspirantes/pruebas-aspirantes.service';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';
import { DetallePruebaDialogComponent } from './detalle-prueba-dialog.component';

/** Fecha local en formato yyyy-MM-dd (sin pasar por UTC). */
function isoLocal(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

@Component({
  selector: 'app-pruebas-aspirantes',
  templateUrl: './pruebas-aspirantes.component.html',
  styleUrls: ['./pruebas-aspirantes.component.scss']
})
export class PruebasAspirantesComponent implements OnInit {

  desde = isoLocal(new Date(Date.now() - 30 * 24 * 3600 * 1000));
  hasta = isoLocal(new Date());

  pruebas: PruebaAspirante[] = [];
  cargando = false;
  guardando = false;
  procesando: Record<number, boolean> = {};

  mostrarFormulario = false;
  /** Prueba recien creada: se muestra su codigo con las dos formas de abrirla. */
  creada: PruebaAspirante | null = null;

  readonly columnas = ['fecha', 'aspirante', 'estado', 'resultado', 'acciones'];
  readonly formatoCodigo = formatoCodigo;

  form = this.fb.group({
    nombre:    ['', [Validators.required, Validators.maxLength(200)]],
    sexo:      ['' as '' | 'M' | 'F', Validators.required],
    edadAnios: [null as number | null, [Validators.min(14), Validators.max(99)]],
    edadMeses: [null as number | null, [Validators.min(0), Validators.max(11)]],
    puesto:    ['', Validators.maxLength(150)],
    lugar:     ['', Validators.maxLength(150)],
    ciudad:    ['', Validators.maxLength(100)],
  });

  constructor(
    private fb: FormBuilder,
    private svc: PruebasAspirantesService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private tokenService: TokenService,
    private store: Store<fromRoot.State>,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (!this.desde || !this.hasta) return;
    this.cargando = true;
    this.svc.listar(this.desde, this.hasta).subscribe({
      next: lista => { this.pruebas = lista; this.cargando = false; },
      error: err => {
        this.cargando = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudieron cargar las pruebas.');
      }
    });
  }

  // ----- Nueva prueba -----

  nueva(): void {
    this.creada = null;
    this.form.reset({ nombre: '', sexo: '', edadAnios: null, edadMeses: null, puesto: '', lugar: '', ciudad: '' });
    this.mostrarFormulario = true;
  }

  crear(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const texto = (s: string | null | undefined) => (s ?? '').trim() || null;

    this.guardando = true;
    this.svc.crear({
      nombre:    (v.nombre ?? '').trim(),
      sexo:      v.sexo as 'M' | 'F',
      edadAnios: v.edadAnios ?? null,
      edadMeses: v.edadMeses ?? null,
      puesto:    texto(v.puesto),
      lugar:     texto(v.lugar),
      ciudad:    texto(v.ciudad),
    }).subscribe({
      next: d => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.creada = d.prueba;
        this.notification.success('Prueba creada.');
        this.cargar();
      },
      error: err => {
        this.guardando = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo crear la prueba.');
      }
    });
  }

  // ----- Acciones -----

  puedeAbrirse(p: PruebaAspirante): boolean {
    return p.estado === 'Pendiente' || p.estado === 'En curso';
  }

  enlace(p: PruebaAspirante): string {
    return `${window.location.origin}/prueba/${p.codigo}`;
  }

  copiar(p: PruebaAspirante): void {
    // Solo el enlace: con texto extra (espacios) el navegador lo toma como busqueda al pegarlo
    const fallo = () => this.notification.error(`No se pudo copiar. Enlace: ${this.enlace(p)}`);
    if (!navigator.clipboard) { fallo(); return; }
    navigator.clipboard.writeText(this.enlace(p)).then(
      () => this.notification.success(`Enlace copiado. Código: ${formatoCodigo(p.codigo)}`),
      fallo
    );
  }

  /**
   * Cierra la sesion del usuario en esta PC y abre la hoja de respuestas: asi el
   * aspirante no puede entrar al sistema desde otra pestana con la sesion abierta.
   */
  iniciarEnEstaPc(p: PruebaAspirante): void {
    const ok = confirm(
      `Se cerrará tu sesión en esta computadora y se abrirá la hoja de respuestas de ${p.nombre}.\n\n` +
      'Cuando el aspirante termine, vuelve a iniciar sesión para ver el resultado. ¿Continuar?');
    if (!ok) return;

    this.dialog.closeAll();
    this.tokenService.cerrarSesion();
    this.store.dispatch(new fromUser.SignOut());
    this.router.navigate(['/prueba', p.codigo]);
  }

  verDetalle(p: PruebaAspirante): void {
    this.dialog.open(DetallePruebaDialogComponent, {
      data: { id: p.id },
      width: '960px',
      maxWidth: '96vw',
      autoFocus: false
    }).afterClosed().subscribe(() => this.cargar());
  }

  anular(p: PruebaAspirante): void {
    if (!confirm(`¿Anular la prueba de ${p.nombre}? El código dejará de funcionar.`)) return;
    this.procesando[p.id] = true;
    this.svc.anular(p.id).subscribe({
      next: () => {
        this.procesando[p.id] = false;
        if (this.creada?.id === p.id) this.creada = null;
        this.notification.success('Prueba anulada.');
        this.cargar();
      },
      error: err => {
        this.procesando[p.id] = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo anular la prueba.');
      }
    });
  }

  claseEstado(estado: string): string {
    return 'pa-estado-' + estado.toLowerCase().replace(' ', '-');
  }
}
