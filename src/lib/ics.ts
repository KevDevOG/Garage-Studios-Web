// ── Generación del archivo .ics del enlace "Añadir al calendario" ──
// Funciones puras (probadas con `node --test`). La ruta
// /api/calendar/[token] solo busca la reserva y delega aquí.
//
// Privacidad: el evento NO incluye datos personales (ni nombre, ni email, ni
// teléfono). Si el enlace se reenvía o se filtra, solo revela que hay una
// sesión en el estudio a una hora. Además caduca 30 días después de la sesión.

import { todayInStudio } from "@/lib/dates";

/** Días tras la sesión durante los que el enlace sigue funcionando. */
export const ICS_LINK_GRACE_DAYS = 30;

export interface IcsReservation {
  fecha_reserva: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm[:ss]
  hora_fin: string; // HH:mm[:ss] ("24:00" o "00:00" = medianoche)
  servicio_nombre: string | null;
}

/** Escapa texto para propiedades iCalendar (RFC 5545 §3.3.11). */
export function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** YYYY-MM-DD → YYYYMMDD, con desplazamiento opcional de días. */
export function icsDate(isoDate: string, addDays = 0): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + addDays));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** "HH:mm[:ss]" → "HHmmss". */
export function icsTime(time: string): string {
  const [h, m = "00", s = "00"] = time.split(":");
  return `${h.padStart(2, "0")}${m.padStart(2, "0")}${s.padStart(2, "0")}`;
}

/**
 * ¿Sigue vigente el enlace? Vale hasta ICS_LINK_GRACE_DAYS días después de
 * la fecha de la sesión (zona Atlantic/Canary). Misma regla que la RPC
 * `get_reserva_by_calendar_token` de la migración 022.
 */
export function isIcsLinkActive(fechaReserva: string, now: Date = new Date()): boolean {
  const limit = icsDate(fechaReserva, ICS_LINK_GRACE_DAYS);
  const today = todayInStudio(now).replace(/-/g, "");
  return today <= limit;
}

/** Construye el contenido del archivo .ics (CRLF, RFC 5545). */
export function buildReservationIcs(token: string, reserva: IcsReservation, now: Date = new Date()): string {
  const endHour = reserva.hora_fin.split(":")[0];
  const endsAtMidnight = endHour === "24" || reserva.hora_fin.startsWith("00:00");

  const dtStart = `${icsDate(reserva.fecha_reserva)}T${icsTime(reserva.hora_inicio)}`;
  const dtEnd = endsAtMidnight
    ? `${icsDate(reserva.fecha_reserva, 1)}T000000`
    : `${icsDate(reserva.fecha_reserva)}T${icsTime(reserva.hora_fin)}`;

  const dtStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const servicio = escapeIcs(reserva.servicio_nombre || "Sesión");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Garage Studios//Sistema de Reservas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${token}@garagestudios.es`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Atlantic/Canary:${dtStart}`,
    `DTEND;TZID=Atlantic/Canary:${dtEnd}`,
    `SUMMARY:Reserva Garage Studios - ${servicio}`,
    `DESCRIPTION:Sesión en Garage Studios.\\nServicio: ${servicio}\\nContacto: +34 661 65 26 38`,
    "LOCATION:C. Drago\\, 35010 Las Palmas de Gran Canaria\\, Las Palmas",
    "URL:https://garagestudios.es",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
