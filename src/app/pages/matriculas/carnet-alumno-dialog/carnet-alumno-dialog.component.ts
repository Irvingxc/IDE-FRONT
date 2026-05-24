import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AlumnoResponse, AlumnoService } from '@app/services/alumno/alumno.service';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-carnet-alumno-dialog',
  templateUrl: './carnet-alumno-dialog.component.html',
  styleUrls: ['./carnet-alumno-dialog.component.scss']
})
export class CarnetAlumnoDialogComponent implements OnInit {

  qrDataUrl:   string | null = null;
  fotoBase64:  string | null = null;
  cargando = true;
  anio = new Date().getFullYear();

  get codigoIde(): string {
    return `IDE-${String(this.alumno.codigo).padStart(6, '0')}`;
  }

  constructor(
    private alumnoService: AlumnoService,
    public  dialogRef: MatDialogRef<CarnetAlumnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public alumno: AlumnoResponse
  ) {}

  async ngOnInit(): Promise<void> {
    this.qrDataUrl = await QRCode.toDataURL(this.codigoIde, {
      width:  160,
      margin: 1,
      color:  { dark: '#6B0F1A', light: '#ffffff' }
    });

    this.alumnoService.getFoto(this.alumno.identidad).subscribe({
      next: ({ foto }) => { this.fotoBase64 = foto ?? null; this.cargando = false; },
      error: ()         => { this.cargando = false; }
    });
  }

  imprimir(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(this.buildHtml());
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 700);
  }

  private buildHtml(): string {
    const foto   = this.fotoBase64 ?? '';
    const qr     = this.qrDataUrl  ?? '';
    const nombre = this.alumno.nombreCompleto ?? '';
    const grado  = this.alumno.grado          ?? '';
    const codigo = this.codigoIde;
    const anio   = this.anio;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Carnet — ${nombre}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 0; }
    html, body {
      width: 297mm; height: 210mm;
      font-family: Arial, sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ambos-lados {
      width: 112mm; height: 88mm;
      display: flex; flex-direction: row;
      box-shadow: none;
    }

    .carnet, .reverso {
      width: 56mm; height: 88mm;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* ── Header ~21mm ── */
    .header {
      background: #6B0F1A;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      padding: 2mm 3mm 1.5mm;
      flex-shrink: 0;
    }
    .header svg  { height: 13mm; width: auto; }
    .school-sub  { font-size: 5.5pt; color: #FFD700; font-weight: bold; text-align: center; line-height: 1.3; }
    .school-name { font-size: 4pt; color: rgba(255,255,255,0.75); text-align: center; letter-spacing: 0.3px; }
    .carnet-label {
      font-size: 4.5pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.85);
      border-top: 0.3mm solid rgba(255,255,255,0.3);
      padding-top: 1mm;
      width: 100%;
      text-align: center;
    }

    /* ── Body (flex:1, ~60mm) ── */
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      padding: 1.5mm 3mm 1mm;
      overflow: hidden;
    }

    .foto-wrap {
      width: 20mm; height: 25mm;
      border-radius: 1.5mm;
      overflow: hidden;
      border: 0.5mm solid #6B0F1A;
      flex-shrink: 0;
      background: #f5f5f5;
      display: flex; align-items: center; justify-content: center;
    }
    .foto-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .foto-placeholder { font-size: 10mm; color: #ccc; }

    .info {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1mm;
      text-align: center;
    }
    .nombre {
      font-size: 6.5pt;
      font-weight: bold;
      color: #111;
      text-transform: uppercase;
      line-height: 1.25;
    }
    .grado  { font-size: 5pt; color: #555; }
    .codigo {
      font-size: 5.5pt;
      font-weight: bold;
      color: #6B0F1A;
      font-family: 'Courier New', monospace;
      background: #fdf0f2;
      padding: 0.8mm 2mm;
      border-radius: 1mm;
      display: inline-block;
    }

    .qr-wrap img { width: 16mm; height: 16mm; display: block; }

    /* ══ REVERSO ══ */
    .rv-header {
      background: #6B0F1A;
      color: #fff;
      text-align: center;
      padding: 1.8mm 2mm 1.5mm;
      flex-shrink: 0;
      line-height: 1.3;
    }
    .rv-school { font-size: 5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; }
    .rv-sub    { font-size: 3.5pt; color: #FFD700; }

    .rv-body {
      flex: 1;
      background: #FFD700;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      padding: 2mm 3mm;
      overflow: hidden;
    }
    .rv-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5mm;
    }
    .rv-deco-line {
      width: 65%; height: 0.4mm;
      background: #6B0F1A;
      opacity: 0.4;
      border-radius: 1mm;
    }
    .rv-badge {
      background: #6B0F1A;
      color: #FFD700;
      font-size: 6pt;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 1mm 4mm;
      border-radius: 0.8mm;
    }
    .rv-quote {
      font-size: 6.5pt;
      color: #2D1200;
      line-height: 1.6;
      text-align: center;
      font-style: italic;
    }
    .rv-firma {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5mm;
    }
    .rv-firma img { width: 12mm; height: auto; object-fit: contain; mix-blend-mode: multiply; }
    .rv-firma-nombre { font-size: 3.5pt; color: #6B0F1A; font-weight: bold; text-align: center; letter-spacing: 0.3px; }
    .rv-firma-cargo  { font-size: 3.5pt; color: #6B0F1A; text-align: center; letter-spacing: 0.3px; }
    .rv-pride {
      font-size: 6pt;
      font-weight: bold;
      letter-spacing: 4px;
      color: #6B0F1A;
      text-transform: uppercase;
      margin-top: 0.5mm;
      width: 100%;
      text-align: center;
    }

    .rv-footer {
      background: #6B0F1A;
      color: #fff;
      padding: 1.8mm 3mm;
      display: flex;
      flex-direction: column;
      gap: 1mm;
      flex-shrink: 0;
    }
    .rv-contacto-row { display: flex; align-items: center; gap: 1.5mm; font-size: 3.8pt; line-height: 1.3; }
    .rv-icon { font-size: 4.5pt; flex-shrink: 0; }
    .rv-slogan {
      text-align: center;
      font-size: 5pt;
      font-weight: bold;
      letter-spacing: 3px;
      color: #FFD700;
      border-top: 0.3mm solid rgba(255,215,0,0.3);
      padding-top: 1mm;
      margin-top: 0.5mm;
      text-transform: uppercase;
    }

    /* ── Footer ~4mm ── */
    .footer {
      background: #6B0F1A;
      color: rgba(255,255,255,0.8);
      font-size: 3.5pt;
      text-align: center;
      padding: 1mm;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
<div class="ambos-lados">
<div class="carnet">

  <div class="header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 56">
      <circle cx="28" cy="28" r="25" fill="#FFD700"/>
      <polygon points="28,9 44,16 28,23 12,16" fill="#2D1200"/>
      <path d="M20,21 L20,27 Q28,31.5 36,27 L36,21" fill="#2D1200"/>
      <line x1="44" y1="16" x2="44" y2="25" stroke="#2D1200" stroke-width="2"/>
      <circle cx="44" cy="27" r="2.5" fill="#2D1200"/>
      <path d="M12,31 L12,47 Q20,45 28,47 L28,31 Q20,29 12,31 Z" fill="#2D1200"/>
      <path d="M44,31 L44,47 Q36,45 28,47 L28,31 Q36,29 44,31 Z" fill="#2D1200"/>
      <line x1="28" y1="31" x2="28" y2="47" stroke="#FFD700" stroke-width="1.5"/>
      <line x1="15" y1="35" x2="26" y2="34" stroke="#8B6914" stroke-width="0.8"/>
      <line x1="15" y1="38" x2="26" y2="37" stroke="#8B6914" stroke-width="0.8"/>
      <line x1="15" y1="41" x2="26" y2="40" stroke="#8B6914" stroke-width="0.8"/>
      <line x1="41" y1="35" x2="30" y2="34" stroke="#8B6914" stroke-width="0.8"/>
      <line x1="41" y1="38" x2="30" y2="37" stroke="#8B6914" stroke-width="0.8"/>
      <line x1="41" y1="41" x2="30" y2="40" stroke="#8B6914" stroke-width="0.8"/>
      <text x="60" y="38" font-family="Georgia,serif" font-weight="bold" font-size="27" fill="#FFD700" letter-spacing="6">IDE</text>
    </svg>
    <div class="school-sub">Institute for the Development of Excellence</div>
    <div class="school-name">Danlí, El Paraíso, Honduras</div>
    <div class="carnet-label">Carnet Estudiantil ${anio}</div>
  </div>

  <div class="body">
    <div class="foto-wrap">
      ${foto ? `<img src="${foto}" alt="foto">` : `<span class="foto-placeholder">&#128100;</span>`}
    </div>

    <div class="info">
      <div class="nombre">${nombre}</div>
      <div class="grado">${grado}</div>
      <div class="codigo">${codigo}</div>
    </div>

    <div class="qr-wrap">
      ${qr ? `<img src="${qr}" alt="QR">` : ''}
    </div>
  </div>

  <div class="footer">
    Vigencia ${anio}
  </div>

</div>

<!-- ══ REVERSO ══ -->
<div class="reverso">

  <div class="rv-header">
    <div class="rv-school">IDE Danlí, El Paraíso</div>
    <div class="rv-sub">Institute for the Development of Excellence</div>
  </div>

  <div class="rv-body">
    <div class="rv-deco-line"></div>
    <div class="rv-badge">Misión</div>
    <div class="rv-quote">"Somos un centro educativo comprometido en la formación de profesionales de alto nivel, con talentos excepcionales para afrontar los retos del mundo actual, ofreciendo educación bilingüe de óptima calidad en los niveles de prebásica, básica y media."</div>
    <div class="rv-deco-line"></div>
    <div class="rv-bottom">
      <div class="rv-firma">
        <img src="/assets/firma_carnet.png" alt="Firma y Sello">
        <div class="rv-firma-nombre">SATURNINO CALIX EUCEDA</div>
        <div class="rv-firma-cargo">DIRECTOR</div>
      </div>
      <div class="rv-pride">IDE PRIDE</div>
    </div>
  </div>

  <div class="rv-footer">
    <div class="rv-contacto-row">
      <span class="rv-icon">&#128222;</span>
      <span>3165 0838</span>
    </div>
    <div class="rv-contacto-row">
      <span class="rv-icon">&#128205;</span>
      <span>Res. Villa Madrid, Danlí · 100m al este de la UNAH</span>
    </div>
  </div>

</div>
</div>
</body>
</html>`;
  }
}
