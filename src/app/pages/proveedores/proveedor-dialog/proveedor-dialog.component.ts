import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProveedoresService, ProveedorDto, CATEGORIAS_PROVEEDOR } from '@app/services/proveedores/proveedores.service';

@Component({
  selector: 'app-proveedor-dialog',
  templateUrl: './proveedor-dialog.component.html',
  styleUrls: ['./proveedor-dialog.component.scss'],
})
export class ProveedorDialogComponent implements OnInit {

  nombre           = '';
  rtn              = '';
  telefono         = '';
  correo           = '';
  contacto         = '';
  telefonoContacto = '';
  direccion        = '';
  categoria        = '';
  activo           = true;
  guardando        = false;

  readonly categorias = CATEGORIAS_PROVEEDOR;

  get esEdicion(): boolean { return !!this.data?.id; }
  get titulo(): string     { return this.esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'; }

  constructor(
    public  dialogRef: MatDialogRef<ProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProveedorDto | null,
    private provService: ProveedoresService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.nombre           = this.data.nombre;
      this.rtn              = this.data.rtn              ?? '';
      this.telefono         = this.data.telefono         ?? '';
      this.correo           = this.data.correo           ?? '';
      this.contacto         = this.data.contacto         ?? '';
      this.telefonoContacto = this.data.telefonoContacto ?? '';
      this.direccion        = this.data.direccion        ?? '';
      this.categoria        = this.data.categoria        ?? '';
      this.activo           = this.data.activo;
    }
  }

  get puedeGuardar(): boolean {
    return !!this.nombre.trim() && !this.guardando;
  }

  guardar(): void {
    if (!this.puedeGuardar) return;
    this.guardando = true;

    const dto = {
      nombre:           this.nombre.trim(),
      rtn:              this.rtn.trim()              || undefined,
      telefono:         this.telefono.trim()         || undefined,
      correo:           this.correo.trim()           || undefined,
      contacto:         this.contacto.trim()         || undefined,
      telefonoContacto: this.telefonoContacto.trim() || undefined,
      direccion:        this.direccion.trim()        || undefined,
      categoria:        this.categoria               || undefined,
      activo:           this.activo,
    };

    const ok = () => {
      this.guardando = false;
      this.snack.open(this.esEdicion ? 'Proveedor actualizado' : 'Proveedor registrado', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    };
    const ko = (err: any) => {
      this.guardando = false;
      this.snack.open(err?.error?.message ?? 'Error al guardar', '', { duration: 4000 });
    };

    if (this.esEdicion) {
      this.provService.actualizar(this.data!.id, dto).subscribe({ next: ok, error: ko });
    } else {
      this.provService.guardar(dto).subscribe({ next: ok, error: ko });
    }
  }
}
