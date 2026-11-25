"use server";

import { createClient } from "@/lib/supabase/server";
import { createPublicClient, createServiceClient } from "@/lib/supabase/public";
import {
  generateTimeSlots,
  timeToMinutes,
  isSlotAvailable,
} from "@/lib/schedule";
import { isValidIsoDate, todayInStudio, nowMinutesInStudio, weekdayOfIsoDate } from "@/lib/dates";
import { isUuid } from "@/lib/reservation-rules";

export interface AvailableSlotResult {
  slots: string[];
  duracion: number;
  mensaje?: string;
}

interface OccupiedInterval {
  start: number;
  end: number;
}

/**
 * Consulta los intervalos ocupados de una fecha mediante la función RPC
 * SECURITY DEFINER `get_occupied_slots` (reservas activas, bloques y
 * bloqueos manuales). Devuelve solo horas, nunca datos personales, por lo
 * que puede ejecutarla el rol anónimo.
 *
 * Devuelve `null` si la consulta falla: quien llama debe tratarlo como
 * "no se puede garantizar disponibilidad" (fallo cerrado). La restricción de
 * exclusión de la BD solo cubre reserva contra reserva, no los bloqueos.
 */
async function fetchOccupiedSlots(fecha: string): Promise<OccupiedInterval[] | null> {
  const supabase = createServiceClient({ fresh: true }) ?? createPublicClient({ fresh: true });
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_occupied_slots", { p_fecha: fecha });

  if (error) {
    console.error("[Availability] Error en get_occupied_slots:", error.message);
    return null;
  }

  const occupied: OccupiedInterval[] = [];
  for (const row of (data ?? []) as { hora_inicio: string | null; hora_fin: string | null }[]) {
    if (row.hora_inicio && row.hora_fin) {
      occupied.push({ start: timeToMinutes(row.hora_inicio), end: timeToMinutes(row.hora_fin) });
    }
  }
  return occupied;
}

/**
 * Obtiene los horarios disponibles para un servicio en una fecha concreta.
 * Excluye horas ocupadas y, si la fecha es hoy, las horas ya pasadas.
 */
export async function getAvailableSlots(
  serviceId: string,
  fecha: string
): Promise<AvailableSlotResult> {
  if (!isUuid(serviceId) || !isValidIsoDate(fecha)) {
    return { slots: [], duracion: 0, mensaje: "Datos de consulta no válidos." };
  }

  const supabase = createPublicClient({ fresh: true });
  if (!supabase) {
    return { slots: [], duracion: 0, mensaje: "El servicio de reservas no está disponible ahora mismo." };
  }

  // 1. Duración del servicio (solo servicios activos)
  const { data: servicio, error: srvErr } = await supabase
    .from("servicio")
    .select("duracion_minutos")
    .eq("id", serviceId)
    .eq("activo", true)
    .maybeSingle();

  if (srvErr || !servicio) {
    return { slots: [], duracion: 0, mensaje: "Servicio no encontrado." };
  }

  const duracion = Number(servicio.duracion_minutos);
  if (!Number.isFinite(duracion) || duracion <= 0) {
    return { slots: [], duracion: 0, mensaje: "Este servicio no admite reserva online." };
  }

  // 2. Slots posibles según el día de la semana (independiente de la zona del servidor)
  const allSlots = generateTimeSlots(weekdayOfIsoDate(fecha), duracion);

  if (allSlots.length === 0) {
    return {
      slots: [],
      duracion,
      mensaje: "El estudio está cerrado ese día o el servicio no cabe en el horario.",
    };
  }

  // 3. Si es hoy, descartar horas ya pasadas (zona Atlantic/Canary)
  const now = new Date();
  const minMinutes = fecha === todayInStudio(now) ? nowMinutesInStudio(now) : -1;

  // 4. Intervalos ocupados (reservas + bloques + bloqueos)
  const occupied = await fetchOccupiedSlots(fecha);
  if (occupied === null) {
    return {
      slots: [],
      duracion,
      mensaje: "No se pudo comprobar la disponibilidad. Inténtalo de nuevo en unos segundos.",
    };
  }

  // 5. Filtrar
  const available = allSlots.filter((slot) => {
    const start = timeToMinutes(slot);
    return start > minMinutes && isSlotAvailable(start, duracion, occupied);
  });

  if (available.length === 0) {
    return {
      slots: [],
      duracion,
      mensaje:
        minMinutes >= 0
          ? "Ya no quedan horas disponibles para hoy. Prueba con otra fecha."
          : "No hay horarios disponibles para esta fecha.",
    };
  }

  return { slots: available, duracion };
}

/**
 * Valida en servidor que un slot sigue libre antes de insertar o mover una
 * reserva. Si se pasa `excludeReservaId` (edición desde el panel), el propio
 * intervalo de esa reserva se descarta para no detectar un falso solapamiento
 * consigo misma.
 */
export async function validateSlotAvailable(
  fecha: string,
  horaInicio: string,
  duracionMinutos: number,
  excludeReservaId?: string
): Promise<boolean> {
  // Las dos lecturas son independientes: van en paralelo (al editar una
  // reserva se ahorra un viaje completo a la base de datos).
  const readOwn = async () => {
    if (!excludeReservaId || !isUuid(excludeReservaId)) return null;
    // Solo un admin autenticado llega aquí; RLS permite leer la reserva.
    const supabase = await createClient();
    const { data } = await supabase
      .from("reserva")
      .select("fecha_reserva, hora_inicio, hora_fin, estado, deleted_at")
      .eq("id", excludeReservaId)
      .maybeSingle();
    return data;
  };

  const [occupied, own] = await Promise.all([fetchOccupiedSlots(fecha), readOwn()]);
  // Fallo cerrado: sin datos fiables no damos el hueco por libre.
  if (occupied === null) return false;

  if (
    own &&
    own.fecha_reserva === fecha &&
    own.hora_inicio &&
    own.hora_fin &&
    !own.deleted_at &&
    (own.estado === "pendiente" || own.estado === "confirmada")
  ) {
    const start = timeToMinutes(own.hora_inicio);
    const end = timeToMinutes(own.hora_fin);
    const index = occupied.findIndex((o) => o.start === start && o.end === end);
    if (index >= 0) occupied.splice(index, 1);
  }

  return isSlotAvailable(timeToMinutes(horaInicio), duracionMinutos, occupied);
}
