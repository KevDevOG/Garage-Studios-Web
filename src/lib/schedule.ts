// ── Horario del estudio Garage Studios ──────────────────────
// Zona horaria: Atlantic/Canary (UTC+0 invierno / UTC+1 verano)
// TODO: En el futuro estos horarios podrían ser editables desde el panel admin

export interface DaySchedule {
  open: string; // HH:mm
  close: string; // HH:mm
}

/**
 * Horario base del estudio indexado por día de la semana (0=Domingo, 6=Sábado).
 * null = cerrado
 */
export const STUDIO_HOURS: Record<number, DaySchedule | null> = {
  0: { open: "15:00", close: "22:00" }, // Domingo
  1: { open: "16:00", close: "22:00" }, // Lunes
  2: { open: "16:00", close: "22:00" }, // Martes
  3: { open: "16:00", close: "22:00" }, // Miércoles
  4: { open: "16:00", close: "22:00" }, // Jueves
  5: { open: "16:00", close: "22:00" }, // Viernes
  6: { open: "10:00", close: "00:00" }, // Sábado (cierra a medianoche)
};

/** Intervalo entre slots en minutos */
export const SLOT_INTERVAL = 30;

/**
 * Convierte "HH:mm" a minutos desde medianoche.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  // Manejar medianoche: "00:00" como cierre = 1440 (24*60)
  if (h === 0 && m === 0) return 1440;
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a "HH:mm".
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Genera todos los slots posibles para un día de la semana dado,
 * considerando que el servicio debe caber completo antes del cierre.
 */
export function generateTimeSlots(
  dayOfWeek: number,
  serviceDurationMinutes: number
): string[] {
  const schedule = STUDIO_HOURS[dayOfWeek];
  if (!schedule) return []; // Día cerrado

  const openMin = timeToMinutes(schedule.open);
  const closeMin = timeToMinutes(schedule.close);
  const slots: string[] = [];

  for (let t = openMin; t + serviceDurationMinutes <= closeMin; t += SLOT_INTERVAL) {
    slots.push(minutesToTime(t));
  }

  return slots;
}

/**
 * Comprueba si un slot específico está disponible.
 * `occupied` es un array de { start: minutos, end: minutos } representando slots ocupados.
 */
export function isSlotAvailable(
  slotStartMinutes: number,
  serviceDurationMinutes: number,
  occupied: { start: number; end: number }[]
): boolean {
  const slotEnd = slotStartMinutes + serviceDurationMinutes;

  for (const occ of occupied) {
    // Hay solapamiento si el slot empieza antes de que termine la reserva
    // y el slot termina después de que empiece la reserva
    if (slotStartMinutes < occ.end && slotEnd > occ.start) {
      return false;
    }
  }

  return true;
}
