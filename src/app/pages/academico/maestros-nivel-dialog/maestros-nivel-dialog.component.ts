import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, ClaseResponse } from '@app/services/academico/academico.service';
import { CatalogoService, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { UsuarioService, UsuarioLista } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services/notification/notification.service';

export interface MaestrosNivelDialogData {
  clase: ClaseResponse;
}

interface FilaAsignacion {
  idNivelIngles: number | null;
  idMaestro:     string | null;
}

/**
 * Maestros de inglés por nivel dentro de una clase por grado: cada maestro ingresa
 * las notas de los alumnos de su nivel; el titular conserva a los demás.
 */
@Component({
  selector: 'app-maestros-nivel-dialog',
  templateUrl: './maestros-nivel-dialog.component.html',
  styleUrls: ['./maestros-nivel-dialog.component.scss'],
})
export class MaestrosNivelDialogComponent implements OnInit {
  filas: FilaAsignacion[] = [];
  niveles: NivelIngles[] = [];
  maestros: UsuarioLista[] = [];
  cargando = true;
  guardando = false;

  constructor(
    private academicoService: AcademicoService,
    private catalogoService: CatalogoService,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<MaestrosNivelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MaestrosNivelDialogData
  ) {}

  get titulo(): string {
    const c = this.data.clase;
    return [c.nombre, c.gradoNombre, c.seccion].filter(Boolean).join(' · ');
  }

  ngOnInit(): void {
    this.catalogoService.getNivelesIngles().subscribe(n => this.niveles = n);
    this.usuarioService.getUsuarios().subscribe(u => this.maestros = u
      .filter(x => x.rol !== 'Cliente')
      .sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)));

    this.academicoService.listarMaestrosNivelClase(this.data.clase.id).subscribe({
      next: (lista) => {
        this.filas = lista.map(m => ({ idNivelIngles: m.idNivelIngles, idMaestro: m.idMaestro }));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.notification.error('No se pudieron cargar los maestros por nivel');
      }
    });
  }

  /** Un nivel solo puede elegirse una vez por clase. */
  nivelUsadoEnOtraFila(idNivel: number, fila: FilaAsignacion): boolean {
    return this.filas.some(f => f !== fila && f.idNivelIngles === idNivel);
  }

  agregarFila(): void {
    this.filas.push({ idNivelIngles: null, idMaestro: null });
  }

  quitarFila(index: number): void {
    this.filas.splice(index, 1);
  }

  guardar(): void {
    if (this.filas.some(f => f.idNivelIngles == null || !f.idMaestro)) {
      this.notification.error('Cada fila debe tener nivel de inglés y maestro');
      return;
    }

    this.guardando = true;
    const asignaciones = this.filas.map(f => ({ idNivelIngles: f.idNivelIngles!, idMaestro: f.idMaestro! }));
    this.academicoService.guardarMaestrosNivelClase(this.data.clase.id, asignaciones).subscribe({
      next: () => {
        this.notification.success('Maestros por nivel guardados correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err.error?.errores?.mensaje ?? 'Error al guardar los maestros por nivel');
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
