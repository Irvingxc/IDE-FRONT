import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-session-warning-dialog',
  template: `
    <div class="session-warning">
      <div class="icon-wrap">
        <mat-icon class="warn-icon">access_time</mat-icon>
      </div>
      <h2 mat-dialog-title>Sesión por vencer</h2>
      <mat-dialog-content>
        <p>Tu sesión expirará en</p>
        <div class="countdown">{{ tiempoFormateado }}</div>
        <p class="hint">Si no realizas ninguna acción, la sesión se cerrará automáticamente.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="center">
        <button mat-stroked-button color="warn" (click)="cerrarSesion()">
          <mat-icon>logout</mat-icon> Cerrar sesión
        </button>
        <button mat-raised-button color="primary" (click)="continuar()">
          <mat-icon>check</mat-icon> Entendido
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .session-warning { text-align: center; padding: 8px 0; }
    .icon-wrap { margin-bottom: 4px; }
    .warn-icon { font-size: 48px; width: 48px; height: 48px; color: #f59e0b; }
    h2 { margin: 0 0 8px; font-size: 20px; }
    mat-dialog-content { display: block; }
    .countdown {
      font-size: 48px;
      font-weight: 700;
      color: #ef4444;
      letter-spacing: 2px;
      margin: 12px 0;
      font-variant-numeric: tabular-nums;
    }
    .hint { font-size: 13px; color: #6b7280; margin: 0; }
    mat-dialog-actions { gap: 12px; margin-top: 16px; }
  `]
})
export class SessionWarningDialogComponent implements OnInit, OnDestroy {

  segundosRestantes = 120;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private dialogRef: MatDialogRef<SessionWarningDialogComponent>) {}

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.segundosRestantes--;
      if (this.segundosRestantes <= 0) {
        this.cerrarSesion();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  continuar(): void {
    const token = localStorage.getItem('token');
    if (!token || this.tokenExpirado(token)) {
      this.dialogRef.close(true);
    } else {
      this.dialogRef.close(false);
    }
  }

  cerrarSesion(): void {
    if (this.timer) clearInterval(this.timer);
    this.dialogRef.close(true);
  }

  get tiempoFormateado(): string {
    const seg = Math.max(0, this.segundosRestantes);
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private tokenExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 < Date.now() : false;
    } catch { return true; }
  }
}
