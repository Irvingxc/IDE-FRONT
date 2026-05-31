import { Injectable } from '@angular/core';
import { ClienteResponse } from '@app/services/cliente/cliente.service';
import { AlumnoResponse } from '@app/services/alumno/alumno.service';

@Injectable({ providedIn: 'root' })
export class ContratoService {

  generarContrato(
    cliente: ClienteResponse,
    alumno:  AlumnoResponse | null
  ): void {
    const colegiaturaMensual = alumno?.valorMensualidad ?? 0;
    const colegiaturaAnual   = colegiaturaMensual * 12;
    const hoy  = new Date();
    const anio = hoy.getFullYear();
    const dia  = hoy.getDate();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                   'agosto','septiembre','octubre','noviembre','diciembre'];
    const mes = meses[hoy.getMonth()];

    const html = this.buildHtml(cliente, alumno, colegiaturaMensual, colegiaturaAnual, anio, dia, mes);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 600);
  }

  private formatLps(value: number): string {
    return 'L. ' + value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private buildHtml(
    cliente:            ClienteResponse,
    alumno:             AlumnoResponse | null,
    colegiaturaMensual: number,
    colegiaturaAnual:   number,
    anio:               number,
    dia:                number,
    mes:                string
  ): string {
    const tutorNombre = cliente.nombreCompleto || '___________________________';
    const tutorId     = cliente.identidad      || '___________________________';
    const alumnoNombre = alumno?.nombreCompleto ?? '___________________________';
    const gradoAlumno  = alumno?.grado          ?? '___________________________';

    const descuento    = alumno?.descuento ?? 0;
    const mensualNeto  = colegiaturaMensual * (1 - descuento / 100);
    const anualNeto    = mensualNeto * 12;

    const mensualStr = colegiaturaMensual > 0
      ? `${this.formatLps(mensualNeto)}/mes${descuento > 0 ? ` (descuento aplicado: ${descuento}%)` : ''}`
      : '___________________________';

    const anualStr = colegiaturaAnual > 0 ? this.formatLps(anualNeto) : '___________________________';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato ${tutorNombre}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 2cm 2.5cm;
      line-height: 1.6;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .header img {
      height: 80px;
      width: auto;
      object-fit: contain;
    }
    .header-text {
      text-align: center;
    }
    .header-text .school-name {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-text .rtn {
      font-size: 10pt;
      color: #333;
      margin-top: 2px;
    }
    h1 {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .subtitle {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .intro { margin-bottom: 18px; text-align: justify; }
    .clausula { margin-bottom: 14px; }
    .clausula-titulo {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .clausula-body { text-align: justify; }
    ul { margin: 6px 0 6px 24px; }
    ul li { margin-bottom: 4px; }
    .cierre {
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .firmas {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
    }
    .firma-bloque { width: 45%; text-align: center; }
    .firma-linea {
      border-top: 1px solid #000;
      margin-bottom: 6px;
      width: 90%;
      margin-left: auto;
      margin-right: auto;
    }
    .firma-label { font-size: 11pt; }
    .firma-sub   { font-size: 10pt; color: #444; }
    @media print {
      body { padding: 0; }
      @page { margin: 2cm 2.5cm; size: letter; }
    }
  </style>
</head>
<body>

  <div class="header">
    <img src="/assets/logo.png" alt="Logo IDE"
      onerror="this.style.display='none'">
    <div class="header-text">
      <div class="school-name">Institute for the Development of Excellence</div>
      <div class="school-name">IDE — Danlí, El Paraíso</div>
      <div class="rtn">INVERSIONES CALIX GUTIERREZ S. DE R. L. &nbsp;|&nbsp; RTN: 08019021301711</div>
    </div>
  </div>

  <h1>Contrato de Prestación de Servicios Educativos</h1>
  <div class="subtitle">Año Lectivo ${anio}</div>

  <p class="intro">
    Nosotros, <strong>INVERSIONES CALIX GUTIERREZ S. DE R. L.</strong>, sociedad mercantil con
    RTN: 08019021301711, propietaria del <em>INSTITUTE FOR THE DEVELOPMENT OF EXCELLENCE (IDE)</em>,
    representada en este acto por el Director de la Institución,
    <strong>SATURNINO CALIX EUCEDA</strong>, en adelante denominada <strong>"EL INSTITUTO"</strong>, y por
    otra parte el/la señor(a) <strong>${tutorNombre}</strong>, con identificación
    <strong>${tutorId}</strong>, actuando en su condición de responsable del estudiante
    <strong>${alumnoNombre}</strong>${gradoAlumno !== '___________________________' ? `, de <strong>${gradoAlumno}</strong>` : ''},
    en adelante denominado <strong>"EL PADRE DE FAMILIA O ENCARGADO"</strong>,
    convenimos celebrar el presente contrato, el cual estará regido por las siguientes cláusulas:
  </p>

  <div class="clausula">
    <div class="clausula-titulo">Primera: Objeto del Servicio</div>
    <div class="clausula-body">EL INSTITUTO se compromete a brindar servicios educativos de óptima calidad. El servicio se ejecutará mediante procesos de aprendizaje diseñados para formar profesionales de alto nivel, con énfasis en el pensamiento crítico, bilingüismo y liderazgo.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Segunda: Sujeción al Reglamento Interno</div>
    <div class="clausula-body">Ambas partes declaran conocer y se comprometen formalmente a cumplir con todo lo estipulado en el Reglamento Interno del IDE, el cual forma parte integrante del presente contrato. El incumplimiento de las normas de convivencia, disciplina o ética por parte del estudiante o sus responsables facultará al Instituto para aplicar las sanciones correspondientes, incluyendo la rescisión del contrato.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Tercera: Responsabilidad por Daños y Perjuicios</div>
    <div class="clausula-body">EL PADRE DE FAMILIA, MADRE, TUTOR O ENCARGADO asume la responsabilidad total y se obliga a restituir, reparar o pagar el valor comercial de cualquier daño causado por el estudiante a las instalaciones, laboratorios, mobiliario, equipo didáctico, áreas deportivas o cualquier bien propiedad de INVERSIONES CALIX GUTIERREZ S. DE R. L. El Instituto presentará la valoración del daño, y el responsable deberá hacer efectiva la restitución en un plazo no mayor a treinta (30) días hábiles.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Cuarta: Uso de Área Recreativa y Limitación de Responsabilidad</div>
    <div class="clausula-body">EL INSTITUTO cuenta con un área recreativa equipada con canchas y juegos destinados al esparcimiento de los estudiantes durante los períodos de receso. No obstante, EL INSTITUTO no se responsabiliza por accidentes que puedan sufrir los estudiantes como consecuencia del uso de dichas instalaciones, cuando estos deriven de conductas imprudentes, uso inadecuado de los equipos o incumplimiento de las normas establecidas.
    <br><br>Asimismo, EL PADRE DE FAMILIA O ENCARGADO acepta que EL INSTITUTO no está obligado a proveer balones u otros implementos deportivos para su uso durante los recreos.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Quinta: Postura Ética y Cero Tolerancia al Bullying</div>
    <div class="clausula-body">Bajo la política de Cero Tolerancia al Bullying, se prohíbe cualquier acto de acoso. El incumplimiento de esta política, tanto por el estudiante como por sus encargados en el entorno escolar, será causal de cancelación inmediata de la matrícula, con el fin de salvaguardar la integridad de la comunidad estudiantil.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Sexta: Compromisos Financieros</div>
    <div class="clausula-body">
      <ul>
        <li><strong>Colegiatura:</strong> El costo anual de la colegiatura es de <strong>${anualStr}</strong>, dividido en doce (12) cuotas mensuales de <strong>${mensualStr}</strong>.</li>
        <li><strong>Plazo de pago:</strong> Las cuotas mensuales deberán cancelarse en el período comprendido entre los días veinte (20) y veinticinco (25) de cada mes.</li>
        <li><strong>Mora:</strong> El atraso generará los recargos administrativos estipulados en el Reglamento Interno.</li>
      </ul>
    </div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Séptima: Logística y Recursos</div>
    <div class="clausula-body">Es obligación del encargado proveer los uniformes y materiales requeridos para los procesos de aprendizaje. Por su parte, el Instituto se compromete a facilitar las instalaciones y herramientas necesarias para el desarrollo de una labor educativa de excelencia, bajo la supervisión del Director.</div>
  </div>

  <div class="clausula">
    <div class="clausula-titulo">Octava: Duración</div>
    <div class="clausula-body">El presente contrato finaliza en diciembre de ${anio}, condicionado al cumplimiento de las obligaciones académicas, económicas y conductuales aquí pactadas.</div>
  </div>

  <div class="cierre">
    <p style="text-align:justify;">
      Se firma en dos ejemplares en la ciudad de Danlí, El Paraíso, Honduras, el ${dia} de ${mes} de ${anio}.
    </p>

    <div class="firmas">
      <div class="firma-bloque">
        <div class="firma-linea"></div>
        <div class="firma-label"><strong>Por el INSTITUTO (IDE)</strong></div>
        <div class="firma-sub">SATURNINO CALIX EUCEDA</div>
        <div class="firma-sub">Director de la Institución</div>
        <div class="firma-sub">Firma y Sello</div>
      </div>
      <div class="firma-bloque">
        <div class="firma-linea"></div>
        <div class="firma-label"><strong>EL PADRE / MADRE / ENCARGADO</strong></div>
        <div class="firma-sub">${tutorNombre}</div>
        <div class="firma-sub">Identidad: ${tutorId}</div>
      </div>
    </div>
  </div>

</body>
</html>`;
  }
}
