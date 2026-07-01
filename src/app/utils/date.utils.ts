/** Formatea un Date usando la hora LOCAL (no UTC), evitando el desfase de zona horaria */
export function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Parsea un string "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss" como fecha LOCAL (no UTC).
 *  new Date("YYYY-MM-DD") la trata como UTC midnight y causa desfase en zonas negativas. */
export function parseLocalDate(dateStr: string): Date {
  const [yyyy, mm, dd] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}
