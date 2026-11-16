// ── Utilidades HTML seguras para plantillas de email ──────────
// Los correos se construyen con plantillas de texto; cualquier dato que
// venga del usuario (nombre, notas, asunto…) debe escaparse para evitar
// inyección de HTML en el buzón del administrador o del cliente.

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapa los caracteres especiales de HTML. Acepta valores nulos y los
 * convierte a cadena vacía.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/**
 * Escapa y convierte los saltos de línea en <br/> para texto multilínea.
 */
export function escapeHtmlMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br/>");
}
