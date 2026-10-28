/**
 * Escala de desempeño oficial (ponderación en puntos sobre 100) que se
 * imprime en los PDF de notas del Portal de Padres y de Reportes.
 */
export const ESCALA_DESEMPENO = [
  { minimo: 91, rango: '91 a 100', nivel: 'Excelente',
    descripcion: 'Su desempeño demuestra que aplica los aprendizajes a situaciones variadas, propone soluciones y acciones de mejora; y supera lo esperado en el estándar o en la expectativa de logro evaluado.' },
  { minimo: 80, rango: '80 a 90',  nivel: 'Avanzado',
    descripcion: 'Demuestra dominio en su desempeño en los estándares o expectativas de logro evaluadas. Aplica conocimientos, se expresa con lenguaje adecuado a su edad.' },
  { minimo: 70, rango: '70 a 79',  nivel: 'Básico',
    descripcion: 'Demuestra un desempeño elemental de la expectativa de logro que se ha evaluado. Muestra avance en su proceso de aprendizaje.' },
  { minimo: 0,  rango: 'Hasta 69', nivel: 'Inicial',
    descripcion: 'Las evidencias obtenidas demuestran debilidad para el logro del aprendizaje planificado. Requiere reforzamiento constante.' },
];

export const SIN_CALIFICAR = 'Sin calificar';

interface ClaseConNotas {
  conceptos: { actividades: { nota: number | null }[] }[];
}

/** true si la clase tiene al menos una actividad calificada. */
export function tieneNotas(clase: ClaseConNotas): boolean {
  return clase.conceptos.some(c => c.actividades.some(a => a.nota !== null));
}

/** Nivel según la nota sobre 100 (misma comparación que el antiguo >= 70 de Aprobado). */
export function nivelDesempeno(nota: number): string {
  return (ESCALA_DESEMPENO.find(e => nota >= e.minimo) ?? ESCALA_DESEMPENO[ESCALA_DESEMPENO.length - 1]).nivel;
}

/** Tabla "Escala de desempeño" al pie del PDF. Devuelve la Y final. */
export function dibujarEscalaDesempeno(
  doc: any, autoTable: (doc: any, opciones: any) => void,
  startY: number, margen: number, guinda: [number, number, number]
): number {
  // La escala ocupa ~170 pt; si no cabe completa (muchas materias), va en una página nueva.
  if (startY + 170 > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage();
    startY = 60;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...guinda);
  doc.text('Escala de desempeño', margen, startY);

  autoTable(doc, {
    startY: startY + 6,
    head: [['Ponderación (puntos)', 'Nivel de desempeño', 'Descripción']],
    body: ESCALA_DESEMPENO.map(e => [e.rango, e.nivel, e.descripcion]),
    styles:       { font: 'helvetica', fontSize: 7.5, cellPadding: 4, textColor: 50, lineColor: [230, 224, 216], lineWidth: 0.5, valign: 'middle' },
    headStyles:   { fillColor: guinda, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { halign: 'center', cellWidth: 80 }, 1: { halign: 'center', cellWidth: 80, fontStyle: 'bold' } },
    margin:       { left: margen, right: margen },
  });
  return doc.lastAutoTable.finalY as number;
}
