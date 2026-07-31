import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcademicoService, ClaseResponse } from '@app/services/academico/academico.service';
import { CatalogoService, GradoDto } from '@app/services/catalogo/catalogo.service';
import { UsuarioService, UsuarioLista } from '@app/services/usuario/usuario.service';
import { NotificationService } from '@app/services/notification/notification.service';

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
  maestros: UsuarioLista[] = [];

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private catalogoService: CatalogoService,
    private usuarioService: UsuarioService,
    private notification: NotificationService,
    private dialogRef: MatDialogRef<ClaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClaseDialogData
  ) {
    this.esEdicion = !!data.clase;
    const c = data.clase;

    this.form = this.fb.group({
      nombre:      [c?.nombre ?? '', Validators.required],
      idGrado:     [c?.idGrado ?? null, Validators.required],
      idMaestro:   [c?.idMaestro ?? null],
      anioLectivo: [c?.anioLectivo ?? data.anioLectivo ?? new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    });
  }

  ngOnInit(): void {
    this.catalogoService.getGrados().subscribe(g => this.grados = g);
    this.usuarioService.getUsuarios().subscribe(u => this.maestros = u.filter(x => x.rol !== 'Cliente'));
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const dto = this.form.value;

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
