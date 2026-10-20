import { Component, Input } from '@angular/core';
import { AcademicoService, ClaseResponse, DiarioSemana, GuardarDiarioSemana, PeriodoResponse } from '@app/services/academico/academico.service';
import { NotificationService } from '@app/services/notification/notification.service';

interface TemaEdit {
  texto: string;
}

interface SemanaEdit {
  desde:    Date;
  hasta:    Date;
  esRepaso: boolean;
  temas:    TemaEdit[];
}

interface GrupoPeriodo {
  periodo: PeriodoResponse;
  semanas: SemanaEdit[];
}

const DIAS  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
               'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fechas de negocio sin hora: se leen y se envían como yyyy-MM-dd para no correr el día por zona horaria.
function aFecha(valor: string): Date {
  const [y, m, d] = valor.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function aTexto(fecha: Date): string {
  const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const d = fecha.getDate().toString().padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

@Component({
  selector: 'app-diario-pedagogico',
  templateUrl: './diario-pedagogico.component.html',
  styleUrls: ['./diario-pedagogico.component.scss'],
})
export class DiarioPedagogicoComponent {
  /** Clases que el usuario puede trabajar (un maestro solo recibe las suyas). */
  @Input() clases: ClaseResponse[] = [];
  @Input() esAdmin = false;

  idClase: number | null = null;
  grupos: GrupoPeriodo[] = [];
  cargando = false;
  guardando = false;
  descargandoPdf = false;
  hayCambios = false;

  constructor(
    private academicoService: AcademicoService,
    private notification: NotificationService,
  ) {}

  get clasesOrdenadas(): ClaseResponse[] {
    return [...this.clases].sort((a, b) => this.etiquetaClase(a).localeCompare(this.etiquetaClase(b)));
  }

  get claseSeleccionada(): ClaseResponse | undefined {
    return this.clases.find(c => c.id === this.idClase);
  }

  etiquetaClase(c: ClaseResponse): string {
    const grupo = `${c.gradoNombre ?? c.nivelInglesNombre ?? ''} ${c.seccion ?? ''}`.trim();
    const base = grupo ? `${c.nombre} — ${grupo}` : c.nombre;
    return this.esAdmin && c.maestroNombre ? `${base} (${c.maestroNombre})` : base;
  }

  onClaseChange(nuevo: number): void {
    if (this.hayCambios && !confirm('Hay cambios sin guardar en el diario. ¿Descartarlos?')) {
      const anterior = this.idClase;
      this.idClase = null;
      setTimeout(() => this.idClase = anterior);
      return;
    }
    this.idClase = nuevo;
    this.cargar();
  }

  cargar(): void {
    const clase = this.claseSeleccionada;
    if (!clase) return;
    this.cargando = true;
    this.hayCambios = false;
    this.academicoService.listarPeriodos(clase.anioLectivo).subscribe({
      next: (periodos) => {
        this.academicoService.listarDiario(clase.id).subscribe({
          next: (semanas) => { this.armarGrupos(periodos, semanas); this.cargando = false; },
          error: (err) => {
            this.cargando = false;
            this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo cargar el diario.');
          },
        });
      },
      error: () => { this.cargando = false; },
    });
  }

  private armarGrupos(periodos: PeriodoResponse[], semanas: DiarioSemana[]): void {
    this.grupos = [...periodos]
      .sort((a, b) => a.fechaDesde.localeCompare(b.fechaDesde))
      .map(p => ({
        periodo: p,
        semanas: semanas
          .filter(s => s.idPeriodo === p.id)
          .map(s => ({
            desde:    aFecha(s.fechaDesde),
            hasta:    aFecha(s.fechaHasta),
            esRepaso: s.esRepaso,
            temas:    s.temas.map(t => ({ texto: t })),
          }))
          .sort((a, b) => a.desde.getTime() - b.desde.getTime()),
      }));
  }

  /** Número de semana corrido en todo el año (Semana 9 = primera del II parcial, etc.). */
  numeroSemana(iGrupo: number, iSemana: number): number {
    let n = 0;
    for (let g = 0; g < iGrupo; g++) n += this.grupos[g].semanas.length;
    return n + iSemana + 1;
  }

  minPeriodo(p: PeriodoResponse): Date { return aFecha(p.fechaDesde); }
  maxPeriodo(p: PeriodoResponse): Date { return aFecha(p.fechaHasta); }

  textoFechas(s: SemanaEdit): string {
    if (!s.desde || !s.hasta) return '';
    const d1 = `${DIAS[s.desde.getDay()]} ${s.desde.getDate()}`;
    const d2 = `${DIAS[s.hasta.getDay()].toLowerCase()} ${s.hasta.getDate()} de ${MESES[s.hasta.getMonth()]}`;
    if (s.desde.getTime() === s.hasta.getTime()) return `${d1} de ${MESES[s.desde.getMonth()]}`;
    const mismoMes = s.desde.getMonth() === s.hasta.getMonth();
    return mismoMes ? `${d1} al ${d2}` : `${d1} de ${MESES[s.desde.getMonth()]} al ${d2}`;
  }

  marcarCambio(): void {
    this.hayCambios = true;
  }

  agregarTema(s: SemanaEdit): void {
    s.temas.push({ texto: '' });
    this.marcarCambio();
  }

  quitarTema(s: SemanaEdit, i: number): void {
    s.temas.splice(i, 1);
    this.marcarCambio();
  }

  /** Agrega la semana siguiente (lunes a viernes) al final del período. */
  agregarSemana(g: GrupoPeriodo): void {
    const inicio = this.minPeriodo(g.periodo);
    const fin    = this.maxPeriodo(g.periodo);
    const ultima = g.semanas[g.semanas.length - 1];

    let desde = ultima ? sumarDias(ultima.hasta, 1) : inicio;
    while (desde.getDay() === 0 || desde.getDay() === 6) desde = sumarDias(desde, 1);
    if (desde > fin) {
      this.notification.error(`No quedan días hábiles en "${g.periodo.nombre}" para otra semana.`);
      return;
    }
    // Hasta el viernes de esa semana, sin pasarse del fin del período.
    let hasta = sumarDias(desde, 5 - desde.getDay());
    if (hasta > fin) hasta = fin;

    g.semanas.push({ desde, hasta, esRepaso: false, temas: [] });
    this.marcarCambio();
  }

  quitarSemana(g: GrupoPeriodo, i: number): void {
    const s = g.semanas[i];
    const conTemas = s.temas.some(t => t.texto.trim());
    if (conTemas && !confirm(`¿Quitar la semana del ${this.textoFechas(s)} con sus temas?`)) return;
    g.semanas.splice(i, 1);
    this.marcarCambio();
  }

  guardar(): void {
    const clase = this.claseSeleccionada;
    if (!clase || this.guardando) return;

    for (const g of this.grupos) {
      for (const s of g.semanas) {
        if (!s.desde || !s.hasta || s.desde > s.hasta) {
          this.notification.error(`Revisa las fechas de las semanas de "${g.periodo.nombre}".`);
          return;
        }
      }
    }

    const semanas: GuardarDiarioSemana[] = this.grupos.flatMap(g => g.semanas.map(s => ({
      idPeriodo:  g.periodo.id,
      fechaDesde: aTexto(s.desde),
      fechaHasta: aTexto(s.hasta),
      esRepaso:   s.esRepaso,
      temas:      s.temas.map(t => t.texto.trim()).filter(t => t),
    })));

    this.guardando = true;
    this.academicoService.guardarDiario(clase.id, semanas).subscribe({
      next: (data) => {
        this.guardando = false;
        this.hayCambios = false;
        this.armarGrupos(this.grupos.map(g => g.periodo), data);
        this.notification.success('Diario pedagógico guardado');
      },
      error: (err) => {
        this.guardando = false;
        this.notification.error(err?.error?.errores?.mensaje ?? 'No se pudo guardar el diario.');
      },
    });
  }

  trackByIndex(i: number): number { return i; }

  /** PDF con la tabla Semana / Fechas / Tema agrupada por parcial. */
  async descargarPdf(): Promise<void> {
    const clase = this.claseSeleccionada;
    if (!clase || this.descargandoPdf) return;
    this.descargandoPdf = true;
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const GUINDA: [number, number, number] = [107, 15, 26];
      const CREMA:  [number, number, number] = [250, 246, 240];
      const ORO:    [number, number, number] = [222, 196, 140];

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 40;

      // ── Cabecera ──
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GUINDA);
      doc.setFontSize(14);
      doc.text('Diario Pedagógico', pageW / 2, 50, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text('Institute for the Development of Excellence (IDE) · Danlí, El Paraíso, Honduras',
        pageW / 2, 66, { align: 'center' });

      doc.setDrawColor(...GUINDA);
      doc.setLineWidth(1.5);
      doc.line(M, 76, pageW - M, 76);

      let y = 96;
      const grupo = `${clase.gradoNombre ?? clase.nivelInglesNombre ?? ''} ${clase.seccion ?? ''}`.trim();
      const info: [string, string][] = [
        ['Clase:',       clase.nombre],
        ['Grado:',       grupo || '—'],
        ['Maestro:',     clase.maestroNombre ?? '—'],
        ['Año lectivo:', String(clase.anioLectivo)],
      ];
      doc.setFontSize(10);
      info.forEach(([label, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GUINDA);
        doc.text(label, M, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30);
        doc.text(valor, M + 80, y);
        y += 15;
      });

      // ── Tabla ──
      const body: any[] = [];
      this.grupos.forEach((g, iGrupo) => {
        if (g.semanas.length === 0) return;
        body.push([{
          content: g.periodo.nombre.toUpperCase(),
          colSpan: 3,
          styles: { halign: 'center', fontStyle: 'bold', fillColor: ORO, textColor: 30 },
        }]);
        g.semanas.forEach((s, iSemana) => {
          const temas = s.temas.map(t => t.texto.trim()).filter(t => t);
          const texto = temas.length > 1 ? temas.map(t => `• ${t}`).join('\n')
                      : temas.length === 1 ? temas[0]
                      : s.esRepaso ? 'Semana de repaso' : '—';
          const estilo = s.esRepaso ? { fontStyle: 'italic', fillColor: [235, 235, 240] } : {};
          body.push([
            { content: `Semana ${this.numeroSemana(iGrupo, iSemana)}`, styles: estilo },
            { content: this.textoFechas(s), styles: estilo },
            { content: texto, styles: estilo },
          ]);
        });
      });

      autoTable(doc, {
        startY: y + 6,
        head: [['Semana', 'Fechas', 'Tema']],
        body,
        styles:             { font: 'helvetica', fontSize: 9.5, cellPadding: 5, textColor: 40, lineColor: [210, 204, 196], lineWidth: 0.5, valign: 'middle' },
        headStyles:         { fillColor: GUINDA, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: CREMA },
        columnStyles:       { 0: { cellWidth: 70 }, 1: { cellWidth: 190 } },
        margin:             { left: M, right: M, bottom: 40 },
        didDrawPage: () => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(140);
          doc.text('ETHICS · SCIENCE · TECHNOLOGY', pageW / 2, pageH - 22, { align: 'center' });
        },
      });

      const limpio = (s: string) => (s || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ');
      doc.save(`DIARIO ${limpio(clase.nombre)} ${limpio(grupo)} ${clase.anioLectivo}.pdf`);
    } finally {
      this.descargandoPdf = false;
    }
  }
}
