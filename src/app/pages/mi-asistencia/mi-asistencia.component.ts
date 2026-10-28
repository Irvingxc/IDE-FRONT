import { Component, OnInit } from '@angular/core';
import { AsistenciaService, MiAsistencia, MiAsistenciaDia } from '@app/services/asistencia/asistencia.service';

@Component({
  selector: 'app-mi-asistencia',
  templateUrl: './mi-asistencia.component.html',
  styleUrls: ['./mi-asistencia.component.scss']
})
export class MiAsistenciaComponent implements OnInit {

  readonly meses = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly anios: number[];
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  datos: MiAsistencia | null = null;
  cargando = false;
  error = false;

  constructor(private asistenciaSvc: AsistenciaService) {
    const actual = new Date().getFullYear();
    this.anios = [actual, actual - 1];
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = false;
    this.asistenciaSvc.getMiAsistencia(this.anio, this.mes).subscribe({
      next: (d) => { this.datos = d; this.cargando = false; },
      error: () => { this.datos = null; this.error = true; this.cargando = false; }
    });
  }

  moverMes(delta: number): void {
    const fecha = new Date(this.anio, this.mes - 1 + delta, 1);
    this.anio = fecha.getFullYear();
    this.mes = fecha.getMonth() + 1;
    if (!this.anios.includes(this.anio)) this.anios.push(this.anio);
    this.cargar();
  }

  get esMesActual(): boolean {
    const hoy = new Date();
    return this.anio === hoy.getFullYear() && this.mes === hoy.getMonth() + 1;
  }

  nombreMes(mes: number): string {
    const nombre = new Date(2000, mes - 1, 1).toLocaleDateString('es-HN', { month: 'long' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  get diasPresente(): number {
    return this.datos?.dias.filter(d => d.estado === 'Presente').length ?? 0;
  }

  get diasAusente(): number {
    return this.datos?.dias.filter(d => d.estado === 'Ausente').length ?? 0;
  }

  get horasTotales(): number {
    return this.datos?.dias.reduce((s, d) => s + (d.duracion ?? 0), 0) ?? 0;
  }

  // La fecha llega como 'yyyy-MM-ddT00:00:00' sin zona: se arma con componentes
  // locales para que no salte al día anterior.
  fechaLocal(d: MiAsistenciaDia): Date {
    const [y, m, dia] = d.fecha.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, dia);
  }

  diaSemana(d: MiAsistenciaDia): string {
    return this.fechaLocal(d).toLocaleDateString('es-HN', { weekday: 'short' }).replace('.', '');
  }

  claseEstado(d: MiAsistenciaDia): string {
    switch (d.estado) {
      case 'Presente': return 'presente';
      case 'Ausente':  return 'ausente';
      default:         return 'no-laboral';
    }
  }
}
