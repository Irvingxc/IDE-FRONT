import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserResponse } from '@app/store/user';
import { PerfilDialogComponent } from '@app/components/perfil-dialog/perfil-dialog.component';
import { CambiarPasswordDialogComponent } from '@app/components/cambiar-password-dialog/cambiar-password-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  @Input() user ! : UserResponse | null;
  @Input() isAuthorized! : boolean | null;
  @Output() signOut = new EventEmitter<void>();

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }
  onMenuToggleDispatch(): void{
      this.menuToggle.emit();
  }

  onSignOut(): void {
    this.signOut.emit()
  }

  verPerfil(): void {
    if (!this.user) return;
    this.dialog.open(PerfilDialogComponent, {
      width: '420px',
      data: { user: this.user }
    });
  }

  cambiarPassword(): void {
    this.dialog.open(CambiarPasswordDialogComponent, {
      width: '420px'
    });
  }

}
