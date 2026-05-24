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

@Component({
  selector: 'app-matriculas',
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.scss']
})
export class MatriculasComponent implements OnInit {

  // ── Alumnos ──
  alumnosColumns = ['nombre', 'grado', 'estado', 'descuento', 'tutor', 'acciones'];
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
  clientesColumns = ['id', 'nombre', 'telefono', 'email', 'acciones'];
  clientes: ClienteResponse[] = [];
  clientesLoading = false;
  totalClientes = 0;
  paginaActual = 1;
  readonly PAGE_SIZE = 10;
  filtroNombreCliente = '';

  constructor(
    private dialog: MatDialog,
    private clienteService: ClienteService,
    private alumnoService: AlumnoService,
    private catalogoService: CatalogoService
  ) {}

  ngOnInit(): void {
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
      width: '680px',
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
        },
        error: () => {}
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
}
