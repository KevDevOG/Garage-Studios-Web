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
 * Consulta los intervalos ocupados para una fecha usando la función RPC
 * SECURITY DEFINER (get_occupied_slots). Esto permite que usuarios anónimos
 * obtengan la disponibilidad sin necesidad de SUPABASE_SERVICE_ROLE_KEY.
 */
async function fetchOccupiedSlots(
  fecha: string
): Promise<{ start: number; end: number }[]> {
  // Use a raw supabase-js client with cache disabled to avoid stale reads
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );

  const { data, error } = await supabase.rpc("get_occupied_slots", {
    p_fecha: fecha,
  });

  if (error) {
    console.error("[Availability] Error calling get_occupied_slots RPC:", error.message);
    // Return empty — the backend exclusion constraint is still the final authority
    return [];
  }

  const occupied: { start: number; end: number }[] = [];

  if (data) {
    for (const row of data) {
      if (row.hora_inicio && row.hora_fin) {
        occupied.push({
          start: timeToMinutes(row.hora_inicio),
          end: timeToMinutes(row.hora_fin),
        });
      }
    }
  }

  if (occupied.length > 0) {
    console.log(
      `[Availability] ${occupied.length} intervalo(s) ocupado(s) para ${fecha}`
    );
  }

  return occupied;
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

  // 4. Consultar intervalos ocupados via RPC (bypasses RLS via SECURITY DEFINER)
  const occupied = await fetchOccupiedSlots(fecha);

  // 5. Filtrar slots disponibles
  const available = allSlots.filter((slot) =>
    isSlotAvailable(timeToMinutes(slot), duracion, occupied)
  );

  if (available.length === 0) {
    return {
      slots: [],
      duracion,
      mensaje: "No hay horarios disponibles para esta fecha.",
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
  // Consultar intervalos ocupados via RPC
  const occupied = await fetchOccupiedSlots(fecha);

  // If excluding a specific reservation (e.g. when editing), we'd need
  // the reservation's time range to remove it from occupied. For now,
  // the RPC returns all occupied slots — the exclusion constraint in
  // the DB is the final safety net.

  return isSlotAvailable(timeToMinutes(horaInicio), duracionMinutos, occupied);
}
