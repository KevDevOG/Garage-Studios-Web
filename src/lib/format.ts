// ── Formato de importes y cantidades para el panel ───────────

const EUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const EUR_ROUND = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Importe en euros con céntimos: "118,00 €". */
export function formatEUR(value: number | null | undefined): string {
  return EUR.format(Number.isFinite(value) ? (value as number) : 0);
}

/** Importe en euros sin céntimos, para cifras de resumen: "118 €". */
export function formatEURRound(value: number | null | undefined): string {
  return EUR_ROUND.format(Number.isFinite(value) ? (value as number) : 0);
}

/** Primera letra en mayúscula: "miércoles, 25 de noviembre" → "Miércoles, 25 de noviembre". */
export function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** "1 sesión" / "3 sesiones". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
