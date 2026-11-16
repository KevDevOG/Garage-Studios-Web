// ── Saneado de términos de búsqueda para filtros PostgREST ────
// Las consultas `.or("nombre.ilike.%term%,email.ilike.%term%")` interpolan
// el texto del usuario dentro de la gramática de filtros de PostgREST.
// Comas, paréntesis, puntos y comodines permiten alterar el filtro o
// degradar el rendimiento. Aquí se neutralizan antes de interpolar.

const MAX_SEARCH_LENGTH = 80;

/**
 * Devuelve un término seguro para interpolar en filtros PostgREST.
 * - Elimina caracteres con significado sintáctico en la gramática de filtros.
 * - Escapa los comodines LIKE (`%` y `_`) para que se busquen literalmente.
 * - Recorta espacios y limita la longitud.
 * Devuelve cadena vacía si no queda nada útil.
 */
export function sanitizeSearchTerm(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw
    .replace(/[,()\\"'.:*]/g, " ")
    .replace(/[%_]/g, (ch) => `\\${ch}`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
  return cleaned;
}

/**
 * Construye el patrón ILIKE `%term%` ya saneado, o null si el término no
 * sirve para buscar (menos de 2 caracteres útiles).
 */
export function buildIlikePattern(raw: unknown, minLength = 2): string | null {
  const term = sanitizeSearchTerm(raw);
  // Los comodines escapados no cuentan como caracteres útiles de búsqueda
  const useful = term.replace(/\\[%_]/g, "").replace(/\s/g, "");
  if (useful.length < minLength) return null;
  return `%${term}%`;
}

/**
 * Construye la expresión para `.or()` sobre varias columnas con el mismo
 * patrón: `nombre.ilike.%t%,email.ilike.%t%`.
 */
export function buildOrIlike(columns: string[], pattern: string): string {
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",");
}
