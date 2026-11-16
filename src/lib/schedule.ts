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

/** Minutos de un día completo. Una hora de fin igual a este valor es medianoche. */
export const END_OF_DAY_MINUTES = 1440;

/**
 * Convierte "HH:mm" (o "HH:mm:ss" tal y como lo devuelve Postgres) a minutos
 * desde medianoche. Acepta "24:00" como fin de día (1440).
 *
 * Nota: "00:00" como HORA DE FIN significa medianoche y se interpreta como
 * 1440 para que los cálculos de solapamiento funcionen. Como hora de inicio
 * nunca se genera (el estudio no abre a medianoche).
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (h === 0 && m === 0) return END_OF_DAY_MINUTES;
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a "HH:mm" para GUARDAR en base de datos.
 *
 * El fin de día se devuelve como "24:00", que Postgres acepta como TIME válido
 * y que, sumado a la fecha, produce la medianoche del día SIGUIENTE. Con
 * "00:00" la restricción de exclusión `reserva_no_overlap` construiría un
 * tsrange invertido (fin anterior al inicio) y el INSERT fallaría.
 */
export function minutesToTime(minutes: number): string {
  if (minutes >= END_OF_DAY_MINUTES) return "24:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Normaliza una hora de base de datos ("HH:mm:ss", "24:00:00"…) a "HH:mm"
 * para MOSTRAR al usuario. El fin de día se muestra como "00:00".
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "--:--";
  const [h, m] = time.split(":");
  if (h === "24") return "00:00";
  return `${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
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
 * Comprueba si una hora de inicio es un slot legítimo para ese día y servicio:
 * cae dentro del horario de apertura, está alineada al intervalo y la sesión
 * completa termina antes del cierre. Se usa en servidor para rechazar
 * peticiones manipuladas (p. ej. una reserva a las 03:00).
 */
export function isSlotWithinOpeningHours(
  dayOfWeek: number,
  startTime: string,
  serviceDurationMinutes: number
): boolean {
  return generateTimeSlots(dayOfWeek, serviceDurationMinutes).includes(startTime);
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
