// ── Reglas de validación de servidor para los formularios públicos ──
// Funciones puras (sin acceso a red ni a base de datos) para poder probarlas
// con `node --test`. Las Server Actions las ejecutan ANTES de tocar la base
// de datos: ninguna restricción importante debe depender solo del navegador.

import { isValidIsoDate, isValidTime, nowMinutesInStudio, todayInStudio } from "@/lib/dates";
import { timeToMinutes } from "@/lib/schedule";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 160,
  phoneMax: 25,
  phoneMinDigits: 9,
  notesMax: 1000,
  subjectMin: 2,
  subjectMax: 150,
  messageMin: 5,
  messageMax: 5000,
} as const;

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface ReservationInput {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  timeSlot: string;
  notes: string;
  acceptPrivacy: boolean;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  acceptPrivacy: boolean;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.emailMax && EMAIL_RE.test(value);
}

export function isValidPhone(value: string): boolean {
  if (value.length > LIMITS.phoneMax) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= LIMITS.phoneMinDigits && /^[+\d\s().-]+$/.test(value);
}

/**
 * Valida y normaliza los datos de una solicitud de reserva pública.
 * No comprueba horario de apertura ni disponibilidad: eso requiere la
 * duración del servicio (ver `isSlotInPast` e `isSlotWithinOpeningHours`).
 */
export function validateReservationInput(
  raw: unknown,
  now: Date = new Date()
): ValidationResult<ReservationInput> {
  const input = (raw ?? {}) as Record<string, unknown>;

  const name = str(input.name);
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    return { ok: false, error: "Introduce tu nombre completo." };
  }

  const phone = str(input.phone);
  if (!isValidPhone(phone)) {
    return { ok: false, error: "Introduce un teléfono válido (mínimo 9 dígitos)." };
  }

  const email = str(input.email).toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: "Introduce un email válido." };
  }

  const service = str(input.service);
  if (!isUuid(service)) {
    return { ok: false, error: "Selecciona un servicio válido." };
  }

  const date = str(input.date);
  if (!isValidIsoDate(date)) {
    return { ok: false, error: "La fecha no es válida." };
  }
  if (date < todayInStudio(now)) {
    return { ok: false, error: "La fecha debe ser hoy o posterior." };
  }

  const timeSlot = str(input.timeSlot);
  if (!isValidTime(timeSlot)) {
    return { ok: false, error: "Selecciona un horario válido." };
  }

  const notes = str(input.notes);
  if (notes.length > LIMITS.notesMax) {
    return { ok: false, error: `Las observaciones no pueden superar ${LIMITS.notesMax} caracteres.` };
  }

  if (input.acceptPrivacy !== true) {
    return { ok: false, error: "Debes aceptar la política de privacidad para solicitar la reserva." };
  }

  return {
    ok: true,
    data: { name, phone, email, service, date, timeSlot, notes, acceptPrivacy: true },
  };
}

/**
 * Indica si un slot ya ha pasado: solo puede ocurrir cuando la fecha es hoy
 * en la zona del estudio y la hora de inicio no es posterior a la actual.
 */
export function isSlotInPast(date: string, timeSlot: string, now: Date = new Date()): boolean {
  const today = todayInStudio(now);
  if (date > today) return false;
  if (date < today) return true;
  return timeToMinutes(timeSlot) <= nowMinutesInStudio(now);
}

/**
 * Valida y normaliza los datos del formulario de contacto.
 */
export function validateContactInput(raw: unknown): ValidationResult<ContactInput> {
  const input = (raw ?? {}) as Record<string, unknown>;

  const name = str(input.name);
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    return { ok: false, error: "Introduce tu nombre completo." };
  }

  const email = str(input.email).toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: "Introduce un email válido." };
  }

  const phoneRaw = str(input.phone);
  if (phoneRaw && !isValidPhone(phoneRaw)) {
    return { ok: false, error: "Introduce un teléfono válido (mínimo 9 dígitos)." };
  }

  const subject = str(input.subject);
  if (subject.length < LIMITS.subjectMin || subject.length > LIMITS.subjectMax) {
    return { ok: false, error: "Indica el asunto de tu mensaje." };
  }

  const message = str(input.message);
  if (message.length < LIMITS.messageMin) {
    return { ok: false, error: "Escribe tu mensaje." };
  }
  if (message.length > LIMITS.messageMax) {
    return { ok: false, error: `El mensaje no puede superar ${LIMITS.messageMax} caracteres.` };
  }

  if (input.acceptPrivacy !== true) {
    return { ok: false, error: "Debes aceptar la política de privacidad para enviar el mensaje." };
  }

  return {
    ok: true,
    data: { name, email, phone: phoneRaw || null, subject, message, acceptPrivacy: true },
  };
}
