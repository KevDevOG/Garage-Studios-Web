"use server";

import { createClient } from "@/lib/supabase/server";
import {
  generateTimeSlots,
  timeToMinutes,
  isSlotAvailable,
} from "@/lib/schedule";

export interface AvailableSlotResult {
  slots: string[];
  duracion: number;
  mensaje?: string;
}

/**
 * Obtiene los horarios disponibles para un servicio en una fecha concreta.
 * Consulta reservas y bloques existentes para excluir horas ocupadas.
 */
export async function getAvailableSlots(
  serviceId: string,
  fecha: string
): Promise<AvailableSlotResult> {
  const supabase = await createClient();

  // 1. Obtener duración del servicio
  const { data: servicio, error: srvErr } = await supabase
    .from("servicio")
    .select("duracion_minutos")
    .eq("id", serviceId)
    .single();

  if (srvErr || !servicio) {
    return { slots: [], duracion: 0, mensaje: "Servicio no encontrado." };
  }

  const duracion = servicio.duracion_minutos;

  // 2. Determinar día de la semana de la fecha solicitada
  const dateObj = new Date(fecha + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0=Domingo

  // 3. Generar slots posibles para ese día
  const allSlots = generateTimeSlots(dayOfWeek, duracion);

  if (allSlots.length === 0) {
    return {
      slots: [],
      duracion,
      mensaje: "El estudio está cerrado ese día o el servicio no cabe en el horario.",
    };
  }

  // 4. Consultar reservas existentes para esa fecha (activas, no eliminadas)
  const { data: reservas } = await supabase
    .from("reserva")
    .select("hora_inicio, hora_fin")
    .eq("fecha_reserva", fecha)
    .in("estado", ["pendiente", "confirmada"])
    .is("deleted_at", null)
    .not("hora_inicio", "is", null)
    .not("hora_fin", "is", null);

  // 5. Consultar bloques existentes para esa fecha (activos)
  const { data: bloques } = await supabase
    .from("reserva_bloque")
    .select("hora_inicio, hora_fin, reserva_id")
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  // 6. Consultar bloqueos manuales (bloqueo_horario)
  const { data: bloqueosManuales } = await supabase
    .from("bloqueo_horario")
    .select("hora_inicio, hora_fin")
    .eq("fecha", fecha)
    .is("deleted_at", null);

  // 7. Construir array de intervalos ocupados (en minutos)
  const occupied: { start: number; end: number }[] = [];

  if (reservas) {
    for (const r of reservas) {
      if (r.hora_inicio && r.hora_fin) {
        occupied.push({
          start: timeToMinutes(r.hora_inicio),
          end: timeToMinutes(r.hora_fin),
        });
      }
    }
  }

  if (bloques) {
    for (const b of bloques) {
      occupied.push({
        start: timeToMinutes(b.hora_inicio),
        end: timeToMinutes(b.hora_fin),
      });
    }
  }

  if (bloqueosManuales) {
    for (const bm of bloqueosManuales) {
      occupied.push({
        start: timeToMinutes(bm.hora_inicio),
        end: timeToMinutes(bm.hora_fin),
      });
    }
  }

  // 8. Filtrar slots disponibles
  const available = allSlots.filter((slot) =>
    isSlotAvailable(timeToMinutes(slot), duracion, occupied)
  );

  if (available.length === 0) {
    return {
      slots: [],
      duracion,
      mensaje: "No hay horarios disponibles para este día.",
    };
  }

  return { slots: available, duracion, mensaje: undefined };
}

/**
 * Valida en servidor que un slot sigue libre antes de insertar.
 * Devuelve true si está libre, false si hay conflicto.
 */
export async function validateSlotAvailable(
  fecha: string,
  horaInicio: string,
  duracionMinutos: number,
  excludeReservaId?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Consultar reservas para la fecha
  let query = supabase
    .from("reserva")
    .select("id, hora_inicio, hora_fin")
    .eq("fecha_reserva", fecha)
    .in("estado", ["pendiente", "confirmada"])
    .is("deleted_at", null)
    .not("hora_inicio", "is", null)
    .not("hora_fin", "is", null);

  if (excludeReservaId) {
    query = query.neq("id", excludeReservaId);
  }

  const { data: reservas } = await query;

  // Consultar bloques
  const { data: bloques } = await supabase
    .from("reserva_bloque")
    .select("hora_inicio, hora_fin")
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  // Consultar bloqueos manuales
  const { data: bloqueosManuales } = await supabase
    .from("bloqueo_horario")
    .select("hora_inicio, hora_fin")
    .eq("fecha", fecha)
    .is("deleted_at", null);

  const occupied: { start: number; end: number }[] = [];

  if (reservas) {
    for (const r of reservas) {
      if (r.hora_inicio && r.hora_fin) {
        occupied.push({
          start: timeToMinutes(r.hora_inicio),
          end: timeToMinutes(r.hora_fin),
        });
      }
    }
  }

  if (bloques) {
    for (const b of bloques) {
      occupied.push({
        start: timeToMinutes(b.hora_inicio),
        end: timeToMinutes(b.hora_fin),
      });
    }
  }

  if (bloqueosManuales) {
    for (const bm of bloqueosManuales) {
      occupied.push({
        start: timeToMinutes(bm.hora_inicio),
        end: timeToMinutes(bm.hora_fin),
      });
    }
  }

  return isSlotAvailable(timeToMinutes(horaInicio), duracionMinutos, occupied);
}
