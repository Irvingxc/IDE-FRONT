import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, ClaseResponse } from '@app/services/academico/academico.service';
import { CatalogoService, GradoDto, NivelIngles } from '@app/services/catalogo/catalogo.service';
import { UsuarioService, UsuarioLista } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { NivelInglesDialogComponent } from '../nivel-ingles-dialog/nivel-ingles-dialog.component';

export interface ClaseDialogData {
  clase?: ClaseResponse;
  anioLectivo?: number;
}

@Component({
  selector: 'app-clase-dialog',
  templateUrl: './clase-dialog.component.html',
  styleUrls: ['./clase-dialog.component.scss'],
})
export class ClaseDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  esEdicion: boolean;

  grados: GradoDto[] = [];
  niveles: NivelIngles[] = [];
  maestros: UsuarioLista[] = [];
  secciones: string[] = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private catalogoService: CatalogoService,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ClaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClaseDialogData
  ) {
    this.esEdicion = !!data.clase;
    const c = data.clase;

    this.form = this.fb.group({
      nombre:        [c?.nombre ?? '', Validators.required],
      tipo:          [c?.idNivelIngles != null ? 'nivel' : 'grado', Validators.required],
      idGrado:       [c?.idGrado ?? null],
      idNivelIngles: [c?.idNivelIngles ?? null],
      seccion:       [c?.seccion ?? 'A', Validators.required],
      idMaestro:     [c?.idMaestro ?? null],
      anioLectivo:   [c?.anioLectivo ?? data.anioLectivo ?? new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    });
  }

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
    this.cargarNiveles();
    this.usuarioService.getUsuarios().subscribe(u => this.maestros = u.filter(x => x.rol !== 'Cliente'));
  }

  cargarNiveles(): void {
    this.catalogoService.getNivelesIngles().subscribe(n => this.niveles = n);
  }

  get esPorNivel(): boolean {
    return this.form.get('tipo')?.value === 'nivel';
  }

  nuevoNivel(): void {
    const ref = this.dialog.open(NivelInglesDialogComponent, { width: '400px', data: {} });
    ref.afterClosed().subscribe((nivel: NivelIngles | null) => {
      if (nivel) {
        this.cargarNiveles();
        this.form.patchValue({ idNivelIngles: nivel.id });
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) return;

    const v = this.form.value;
    const esPorNivel = v.tipo === 'nivel';

    if (esPorNivel && !v.idNivelIngles) {
      this.notification.error('Selecciona un nivel de inglés');
      return;
    }
    if (!esPorNivel && !v.idGrado) {
      this.notification.error('Selecciona un grado');
      return;
    }

    this.loading = true;

    const dto = {
      nombre:        v.nombre,
      idGrado:       esPorNivel ? null : v.idGrado,
      idNivelIngles: esPorNivel ? v.idNivelIngles : null,
      seccion:       v.seccion,
      idMaestro:     v.idMaestro,
      anioLectivo:   v.anioLectivo,
    };

    const request = this.esEdicion
      ? this.academicoService.actualizarClase(this.data.clase!.id, dto)
      : this.academicoService.crearClase(dto);

    request.subscribe({
      next: () => {
        this.notification.success(this.esEdicion ? 'Clase actualizada correctamente' : 'Clase creada correctamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.notification.error(err.error?.errores ?? 'Error al guardar la clase');
        this.loading = false;
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
