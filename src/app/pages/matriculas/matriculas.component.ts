import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { EditClienteDialogComponent } from './edit-cliente-dialog/edit-cliente-dialog.component';
import { HijosDialogComponent } from './hijos-dialog/hijos-dialog.component';
import { EditAlumnoDialogComponent } from './edit-alumno-dialog/edit-alumno-dialog.component';
import { ClienteService, ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoService, AlumnoResponse } from '@app/services/alumno/alumno.service';

@Component({
  selector: 'app-matriculas',
  templateUrl: './matriculas.component.html',
  styleUrls: ['./matriculas.component.scss']
})
export class MatriculasComponent implements OnInit {

  // ── Alumnos ──
  alumnosColumns = ['nombre', 'grado', 'estado', 'tutor', 'acciones'];
  alumnos: AlumnoResponse[] = [];
  alumnosLoading = false;
  totalAlumnos = 0;
  paginaAlumnos = 1;

  filtroNombre = '';
  filtroGrado  = '';
  filtroEstado = 'Activo';

  grados = [
    'Primer Grado Pre-Basica',
    'Segundo Grado Pre-Basica',
    'Tercer Grado Pre-Basica',
    'Primer Grado Basica',
    'Segundo Grado Basica',
    'Tercer Grado Basica',
    'Cuarto Grado Basica',
    'Quinto Grado Basica',
    'Sexto Grado Basica',
    'Septimo Grado Basica',
    'Octavo Grado Basica',
    'Noveno Grado Basica',
    'Decimo',
    'Undecimo',
  ];

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
    private alumnoService: AlumnoService
  ) {}

  ngOnInit(): void {
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
      this.filtroGrado,
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
    this.filtroNombre = '';
    this.filtroGrado  = '';
    this.filtroEstado = '';
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
}
