import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { User } from '@app/models/backend/user';
import { RegistrarUsuarioDialogComponent } from './registrar-usuario-dialog/registrar-usuario-dialog.component';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss']
})
export class EmpleadosComponent implements OnInit {

  columns = ['nombre', 'username', 'email', 'telefono', 'acciones'];
  usuarios: User[] = [];
  loading = false;

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  registrar(): void {
    const ref = this.dialog.open(RegistrarUsuarioDialogComponent, {
      width: '620px',
      disableClose: true
    });
    ref.afterClosed().subscribe((registrado) => {
      if (registrado) this.cargarUsuarios();
    });
  }
}
