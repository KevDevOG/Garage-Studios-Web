// ── Agenda del estudio: geometría del calendario ─────────────
// Funciones puras (sin Supabase ni React) que usan el calendario del panel y
// la "pista del día": rangos de fechas, ventana horaria visible y reparto de
// sesiones solapadas en carriles. Las horas se manejan en minutos desde
// medianoche; "24:00" (o "00:00" como hora de fin) son 1440.

import { STUDIO_HOURS, END_OF_DAY_MINUTES, timeToMinutes } from "@/lib/schedule";
import { weekdayOfIsoDate } from "@/lib/dates";

export type AgendaView = "mes" | "semana" | "dia";

export type AgendaTone = "amber" | "ok" | "info" | "bad" | "neutral";

export interface AgendaEvent {
  /** Clave única dentro de la vista. */
  id: string;
  kind: "reserva" | "pack" | "bloqueo";
  /** Día YYYY-MM-DD. */
  fecha: string;
  /** Inicio y fin en minutos; null si la reserva no tiene hora. */
  start: number | null;
  end: number | null;
  /** Cliente o motivo del bloqueo. */
  title: string;
  /** Servicio o título del bloque. */
  subtitle: string | null;
  /** Etiqueta del estado en castellano ("Confirmada", "Bloqueo"…). */
  statusLabel: string;
  tone: AgendaTone;
  href: string | null;
  /** Ocupa hueco en la agenda (no cancelada ni rechazada). */
  occupies: boolean;
}

/** Suma días a una fecha ISO sin depender de la zona horaria del proceso. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeek(isoDate: string): string {
  const weekday = weekdayOfIsoDate(isoDate); // 0 = domingo
  return addDays(isoDate, -(weekday === 0 ? 6 : weekday - 1));
}

/** Los 7 días (lunes a domingo) de la semana de la fecha. */
export function weekDays(isoDate: string): string[] {
  const monday = startOfWeek(isoDate);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Primer día del mes de la fecha. */
export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** Mismo día (o el último válido) del mes desplazado `months` meses. */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), day)).toISOString().slice(0, 10);
}

/**
 * Semanas completas (lunes a domingo) que cubren el mes de la fecha: entre 4
 * y 6 filas de 7 días, incluidos los días de los meses vecinos.
 */
export function monthGrid(isoDate: string): string[][] {
  const first = startOfMonth(isoDate);
  const month = first.slice(0, 7);
  const weeks: string[][] = [];
  let cursor = startOfWeek(first);
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  } while (cursor.slice(0, 7) === month);
  return weeks;
}

/** Horario de apertura de un día en minutos, o null si el estudio cierra. */
export function openingMinutes(isoDate: string): { open: number; close: number } | null {
  const schedule = STUDIO_HOURS[weekdayOfIsoDate(isoDate)];
  if (!schedule) return null;
  return { open: timeToMinutes(schedule.open), close: timeToMinutes(schedule.close) };
}

/** Hora de base de datos ("18:00:00", "24:00:00") a minutos de INICIO. */
export function startMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return Math.min(h * 60 + m, END_OF_DAY_MINUTES);
}

/** Hora de base de datos a minutos de FIN ("00:00" y "24:00" son medianoche). */
export function endMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return timeToMinutes(`${h}:${m}`);
}

/**
 * Ventana horaria que debe mostrar una pista o una rejilla: desde la apertura
 * más temprana hasta el cierre más tardío de los días dados, ampliada si hay
 * sesiones fuera de horario y redondeada a horas completas.
 */
export function visibleRange(
  dates: string[],
  events: Pick<AgendaEvent, "start" | "end">[] = [],
): { start: number; end: number } {
  let start = Infinity;
  let end = -Infinity;

  for (const date of dates) {
    const hours = openingMinutes(date);
    if (!hours) continue;
    start = Math.min(start, hours.open);
    end = Math.max(end, hours.close);
  }
  for (const ev of events) {
    if (ev.start === null) continue;
    start = Math.min(start, ev.start);
    end = Math.max(end, ev.end ?? ev.start + 60);
  }

  // Sin horario ni sesiones (no debería ocurrir): una tarde estándar.
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { start: 16 * 60, end: 22 * 60 };

  start = Math.floor(start / 60) * 60;
  end = Math.min(Math.ceil(end / 60) * 60, END_OF_DAY_MINUTES);
  if (end <= start) end = Math.min(start + 60, END_OF_DAY_MINUTES);
  return { start, end };
}

export interface PlacedEvent<T> {
  event: T;
  /** Carril (0…lanes-1) dentro de su grupo de solapamiento. */
  lane: number;
  /** Carriles que comparten espacio con este evento. */
  lanes: number;
}

/**
 * Reparte en carriles los eventos con hora de un mismo día. Los que no se
 * solapan ocupan todo el ancho; los que coinciden se reparten el espacio.
 */
export function layoutLanes<T extends { start: number | null; end: number | null }>(
  events: T[],
): PlacedEvent<T>[] {
  const timed = events
    .filter((e) => e.start !== null)
    .map((e) => ({ event: e, start: e.start as number, end: Math.max(e.end ?? 0, (e.start as number) + 15) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const placed: PlacedEvent<T>[] = [];
  let group: { item: (typeof timed)[number]; lane: number }[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    const lanes = group.reduce((max, g) => Math.max(max, g.lane + 1), 0);
    for (const g of group) placed.push({ event: g.item.event, lane: g.lane, lanes });
    group = [];
    groupEnd = -Infinity;
  };

  for (const item of timed) {
    if (group.length > 0 && item.start >= groupEnd) flush();
    const laneEnds: number[] = [];
    for (const g of group) laneEnds[g.lane] = Math.max(laneEnds[g.lane] ?? -Infinity, g.item.end);
    let lane = laneEnds.findIndex((endOfLane) => endOfLane <= item.start);
    if (lane === -1) lane = laneEnds.length;
    group.push({ item, lane });
    groupEnd = Math.max(groupEnd, item.end);
  }
  if (group.length > 0) flush();

  return placed;
}

/** Posición de un tramo dentro de la ventana visible, en porcentaje (0-100). */
export function spanPercent(
  start: number,
  end: number,
  range: { start: number; end: number },
): { offset: number; size: number } {
  const total = range.end - range.start;
  const from = Math.max(start, range.start);
  const to = Math.min(Math.max(end, from), range.end);
  return {
    offset: ((from - range.start) / total) * 100,
    size: Math.max(((to - from) / total) * 100, 0),
  };
}

/** Horas en punto dentro de la ventana, para reglas y rejillas. */
export function hourMarks(range: { start: number; end: number }): number[] {
  const marks: number[] = [];
  for (let t = range.start; t <= range.end; t += 60) marks.push(t);
  return marks;
}

/** "18:00" a partir de minutos; 1440 se muestra como "00:00". */
export function minutesLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normaliza el parámetro `view` de la URL (acepta los valores antiguos). */
export function parseAgendaView(value: string | undefined): AgendaView {
  if (value === "mes") return "mes";
  if (value === "dia" || value === "daily") return "dia";
  return "semana";
}
