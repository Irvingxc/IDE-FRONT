/**
 * Escala de desempeño oficial (ponderación en puntos sobre 100) con la que se
 * califica cada materia en los PDF de notas del Portal de Padres y de Reportes.
 */
export const ESCALA_DESEMPENO = [
  { minimo: 91, nivel: 'Excelente' },
  { minimo: 80, nivel: 'Avanzado' },
  { minimo: 70, nivel: 'Básico' },
  { minimo: 0,  nivel: 'Inicial' },
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
