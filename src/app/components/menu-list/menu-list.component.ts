import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss']
})
export class MenuListComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  @Input() isAuthorized!: boolean | null;
  @Input() modulos: string[] | null | undefined;
  @Output() signOut = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}

  closeMenu(): void {
    this.menuToggle.emit();
  }

  onSignOut(): void {
    this.signOut.emit();
  }

  tieneModulo(modulo: string): boolean {
    if (!this.modulos) return true;
    return this.modulos.includes(modulo);
  }
}
