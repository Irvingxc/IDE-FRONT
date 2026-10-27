import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { EditClienteDialogComponent } from './edit-cliente-dialog/edit-cliente-dialog.component';
import { HijosDialogComponent } from './hijos-dialog/hijos-dialog.component';
import { EditAlumnoDialogComponent } from './edit-alumno-dialog/edit-alumno-dialog.component';
import { DescuentoAlumnoDialogComponent } from './descuento-alumno-dialog/descuento-alumno-dialog.component';
import { ContratoDialogComponent } from './contrato-dialog/contrato-dialog.component';
import { CarnetAlumnoDialogComponent } from './carnet-alumno-dialog/carnet-alumno-dialog.component';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { PortalClienteService } from '@app/services/portal-cliente/portal-cliente.service';
import { NotificationService } from '@app/services';
import { Store, select } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import * as fromRoot from '@app/store';
import * as fromUser from '@app/store/user';

@Component({
  selector: 'app-matriculas',
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.scss']
})
export class MatriculasComponent implements OnInit {

  // ── Alumnos ──
  alumnosColumns = ['codigo', 'nombre', 'grado', 'seccion', 'estado', 'descuento', 'tutor', 'acciones'];
  alumnos: AlumnoResponse[] = [];
  alumnosLoading = false;
  totalAlumnos = 0;
  paginaAlumnos = 1;

  filtroNombre    = '';
  filtroIdGrado: number | null = null;
  filtroEstado    = 'Activo';

  grados: GradoDto[] = [];

  readonly ALUMNOS_PAGE_SIZE = 10;

  // ── Clientes ──
  clientesColumns = ['id', 'nombre', 'telefono', 'email', 'portal', 'acciones'];
  clientes: ClienteResponse[] = [];
  clientesLoading = false;
  totalClientes = 0;
  paginaActual = 1;
  readonly PAGE_SIZE = 10;
  filtroNombreCliente = '';

  enviandoAcceso: { [id: number]: boolean } = {};

  // Solo Administrador/Director puede invitar al portal / promover grados (el backend exige ese rol).
  puedeInvitarPortal = false;
  puedePromover = false;

  /** Pestaña inicial: ?tab=promocion abre "Promoción de grado" (lo usa la alerta del inicio). */
  tabInicial = 0;

  constructor(
    private dialog: MatDialog,
    private clienteService: ClienteService,
    private alumnoService: AlumnoService,
    private catalogoService: CatalogoService,
    private portalService: PortalClienteService,
    private notification: NotificationService,
    private store: Store<fromRoot.State>,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.store.pipe(select(fromUser.getUserState)).subscribe(u => {
      const roles: string[] = (u?.entity as any)?.roles ?? [];
      this.puedeInvitarPortal = roles.some(r => r === 'Administrador' || r === 'Director');
      this.puedePromover = this.puedeInvitarPortal;
      // Pestañas: Estudiantes (0), Clientes (1), Promoción de grado (2, solo si puede promover), Prematrícula
      if (this.route.snapshot.queryParamMap.get('tab') === 'promocion' && this.puedePromover) this.tabInicial = 2;
    });
    this.catalogoService.getGrados().subscribe({ next: (data) => this.grados = data ?? [] });
    this.cargarAlumnos();
    this.cargarClientes();
  }

  // ── Alumnos ──

  cargarAlumnos(pagina = 1): void {
    this.alumnosLoading = true;
    this.alumnoService.getAlumnos(
      pagina,
      this.ALUMNOS_PAGE_SIZE,
      this.filtroNombre,
      this.filtroIdGrado ?? undefined,
      this.filtroEstado
    ).subscribe({
      next: (data) => {
        this.alumnos = data ?? [];
        this.totalAlumnos = data?.[0]?.totalRegistros ?? 0;
        this.paginaAlumnos = pagina;
        this.alumnosLoading = false;
      },
      error: () => { this.alumnosLoading = false; }
    });
  }

  onPageAlumnos(event: PageEvent): void {
    this.cargarAlumnos(event.pageIndex + 1);
  }

  buscarAlumnos(): void {
    this.cargarAlumnos(1);
  }

  limpiarFiltros(): void {
    this.filtroNombre    = '';
    this.filtroIdGrado   = null;
    this.filtroEstado    = '';
    this.cargarAlumnos(1);
  }

  editarAlumno(alumno: AlumnoResponse): void {
    const ref = this.dialog.open(EditAlumnoDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      data: alumno
    });
    ref.afterClosed().subscribe((actualizado) => {
      if (actualizado) this.cargarAlumnos(this.paginaAlumnos);
    });
  }

  registrarDescuento(alumno: AlumnoResponse): void {
    const ref = this.dialog.open(DescuentoAlumnoDialogComponent, {
      width: '440px',
      data: alumno
    });
    ref.afterClosed().subscribe((guardado) => {
      if (guardado) this.cargarAlumnos(this.paginaAlumnos);
    });
  }

  inactivarAlumno(alumno: AlumnoResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { nombre: alumno.nombreCompleto }
    });
    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.alumnoService.cambiarEstado(alumno.identidad, 'Inactivo').subscribe({
        next: () => {
          alumno.estado = 'Inactivo';
          this.notification.success('Alumno inactivado.');
        },
        error: (err) => {
          const msg = err?.error?.errores?.mensaje ?? err?.error?.mensaje
            ?? 'No se pudo inactivar el alumno.';
          this.notification.error(msg);
        }
      });
    });
  }

  // ── Clientes ──

  buscarClientes(): void { this.cargarClientes(1); }

  limpiarFiltrosClientes(): void {
    this.filtroNombreCliente = '';
    this.cargarClientes(1);
  }

  cargarClientes(pagina = 1): void {
    this.clientesLoading = true;
    this.clienteService.getClientes(pagina, this.PAGE_SIZE, this.filtroNombreCliente).subscribe({
      next: (data) => {
        this.clientes = data ?? [];
        this.totalClientes = data?.[0]?.totalRegistros ?? 0;
        this.paginaActual = pagina;
        this.clientesLoading = false;
      },
      error: () => { this.clientesLoading = false; }
    });
  }

  onPageChange(event: PageEvent): void {
    this.cargarClientes(event.pageIndex + 1);
  }

  verHijos(cliente: ClienteResponse): void {
    this.dialog.open(HijosDialogComponent, {
      width: '560px',
      data: cliente
    });
  }

  editarCliente(cliente: ClienteResponse): void {
    const ref = this.dialog.open(EditClienteDialogComponent, {
      width: '660px',
      data: cliente
    });
    ref.afterClosed().subscribe((actualizado) => {
      if (actualizado) this.cargarClientes(this.paginaActual);
    });
  }

  generarCarnet(alumno: AlumnoResponse): void {
    this.dialog.open(CarnetAlumnoDialogComponent, {
      width: '440px',
      data: alumno
    });
  }

  generarContrato(cliente: ClienteResponse): void {
    this.dialog.open(ContratoDialogComponent, {
      width: '500px',
      data: cliente
    });
  }

  /** Estado del padre en el Portal de Padres, para la columna "Portal". */
  estadoPortal(c: ClienteResponse): 'activo' | 'invitado' | 'vencida' | 'sin' {
    if (c.tienePortal) return 'activo';
    if (!c.fechaUltimaInvitacion) return 'sin';
    return c.venceUltimaInvitacion && new Date(c.venceUltimaInvitacion) > new Date() ? 'invitado' : 'vencida';
  }

  tituloInvitar(c: ClienteResponse): string {
    if (c.tienePortal) return 'Ya tiene cuenta en el portal';
    if (!c.correoElectronico) return 'Sin correo registrado';
    return c.fechaUltimaInvitacion ? 'Reenviar invitación al portal (genera un enlace nuevo)' : 'Enviar invitación al portal';
  }

  enviarAcceso(cliente: ClienteResponse): void {
    if (cliente.fechaUltimaInvitacion && this.estadoPortal(cliente) === 'invitado' &&
        !confirm(`Ya se le envió una invitación el ${new Date(cliente.fechaUltimaInvitacion).toLocaleString('es-HN')} y sigue vigente. ` +
                 '¿Enviar una nueva? El enlace anterior dejará de funcionar.')) {
      return;
    }
    this.enviandoAcceso[cliente.id] = true;
    this.portalService.invitar(cliente.id).subscribe({
      next: (inv) => {
        this.enviandoAcceso[cliente.id] = false;
        // Refleja la invitación en la fila sin recargar la lista (el enlace vence a las 48 h).
        const ahora = new Date();
        cliente.fechaUltimaInvitacion = ahora.toISOString();
        cliente.venceUltimaInvitacion = new Date(ahora.getTime() + 48 * 3600 * 1000).toISOString();
        // El enlace también se copia al portapapeles por si hay que reenviarlo.
        const link = `${window.location.origin}/activar-cuenta/${inv.token}`;
        navigator.clipboard.writeText(link).catch(() => {});

        if (inv.correoEnviado) {
          this.notification.success(
            `Invitación enviada al correo ${inv.email}. El enlace se copió al portapapeles.`
          );
        } else {
          this.notification.warning(
            `No se pudo enviar el correo a ${inv.email}. El enlace de activación se copió al portapapeles; envíalo manualmente.`
          );
        }
      },
      error: (err) => {
        this.enviandoAcceso[cliente.id] = false;
        const mensaje = err?.error?.errores?.mensaje ?? 'No se pudo generar la invitación.';
        this.notification.error(mensaje);
      }
    });
  }
}
