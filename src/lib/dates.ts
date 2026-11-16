// ── Fechas en la zona horaria del estudio ─────────────────────
// Garage Studios opera en Atlantic/Canary (UTC+0 en invierno, UTC+1 en verano).
// El servidor (Vercel) corre en UTC, así que NUNCA se debe usar
// `new Date().toISOString().split("T")[0]` para obtener "hoy": entre las
// 23:00 y las 00:00 locales devolvería el día anterior o siguiente.
// Todas las funciones de este módulo son puras y testeables.

export const STUDIO_TIMEZONE = "Atlantic/Canary";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: number; // 0=Domingo … 6=Sábado
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Descompone un instante en sus partes locales de Atlantic/Canary.
 */
export function getZonedParts(date: Date = new Date()): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/**
 * Fecha de hoy en el estudio con formato YYYY-MM-DD.
 */
export function todayInStudio(date: Date = new Date()): string {
  const { year, month, day } = getZonedParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Minutos transcurridos desde medianoche en el estudio (0-1439).
 */
export function nowMinutesInStudio(date: Date = new Date()): number {
  const { hour, minute } = getZonedParts(date);
  return hour * 60 + minute;
}

/**
 * Comprueba que una cadena es una fecha ISO válida (YYYY-MM-DD) y real
 * (rechaza 2026-02-30).
 */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

/**
 * Comprueba que una cadena es una hora HH:mm válida.
 */
export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/**
 * Día de la semana (0=Domingo) de una fecha YYYY-MM-DD, independiente de la
 * zona horaria del proceso.
 */
export function weekdayOfIsoDate(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Compara dos fechas ISO (YYYY-MM-DD). Devuelve <0, 0, >0 como un comparador.
 * Las fechas ISO con relleno de ceros se ordenan correctamente como texto.
 */
export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) en castellano para mostrar al usuario,
 * p. ej. "sábado, 21 de noviembre de 2026". No depende de la zona del proceso.
 */
export function formatIsoDateEs(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  if (!isValidIsoDate(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-").map(Number);
  // Mediodía UTC evita que el cambio de zona mueva el día.
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(date);
}

/**
 * Formatea un instante (timestamp ISO) en la zona del estudio.
 */
export function formatDateTimeEs(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-ES", { ...options, timeZone: STUDIO_TIMEZONE }).format(date);
}

/**
 * Primer y último día (YYYY-MM-DD) de un mes. `month` va de 1 a 12.
 * Si `month` es null devuelve el año completo.
 */
export function monthRange(year: number, month: number | null): { start: string; end: string } {
  if (month === null) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}` };
}

/**
 * Normaliza un periodo (mes/año) recibido por query string: acota el mes a
 * 1-12 y el año a un rango razonable, con valores por defecto del estudio.
 */
export function parsePeriod(
  monthParam: string | string[] | undefined,
  yearParam: string | string[] | undefined,
  now: Date = new Date()
): { month: number; year: number } {
  const current = getZonedParts(now);
  const rawMonth = Array.isArray(monthParam) ? monthParam[0] : monthParam;
  const rawYear = Array.isArray(yearParam) ? yearParam[0] : yearParam;

  let month = Number.parseInt(rawMonth ?? "", 10);
  let year = Number.parseInt(rawYear ?? "", 10);

  if (!Number.isFinite(month) || month < 1 || month > 12) month = current.month;
  if (!Number.isFinite(year) || year < 2020 || year > current.year + 5) year = current.year;

  return { month, year };
}
