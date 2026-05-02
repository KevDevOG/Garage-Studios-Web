"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes } from "@/lib/schedule";

// ── Helpers ──

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

function revalidateAll() {
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/dashboard");
}

// ── Tipos ──

export interface ReservationRow {
  id: string;
  servicio_id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_reserva: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  duracion_minutos: number | null;
  observaciones: string | null;
  notas_admin: string | null;
  estado: string;
  origen: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  calendar_event_id: string | null; // TODO: futura integración Apple Calendar
  servicio?: { nombre: string } | null;

  // Campos opcionales para mostrar bloques en el calendario
  is_block?: boolean;
  block_title?: string;
  parent_reserva_id?: string;
}

// ── Obtener reservas en rango ──

export async function getReservations(
  startDate: string,
  endDate: string
): Promise<ReservationRow[]> {
  const supabase = await requireAuth();

  const { data, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) {
    console.error("Error al obtener reservas:", error);
    return [];
  }

  return (data as ReservationRow[]) || [];
}

// ── Obtener reserva individual ──

export async function getReservation(id: string): Promise<ReservationRow | null> {
  const supabase = await requireAuth();

  const { data, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as ReservationRow;
}

// ── Crear reserva manual ──

export async function createManualReservation(formData: FormData) {
  const supabase = await requireAuth();

  const servicioId = formData.get("servicio_id") as string;
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const fecha = formData.get("fecha_reserva") as string;
  const horaInicio = formData.get("hora_inicio") as string;
  const duracionStr = formData.get("duracion_minutos") as string;
  const observaciones = formData.get("observaciones") as string;
  const notasAdmin = formData.get("notas_admin") as string;
  const estado = (formData.get("estado") as string) || "pendiente";

  const duracion = parseInt(duracionStr, 10);
  if (isNaN(duracion) || duracion <= 0) {
    return { error: "Duración inválida" };
  }

  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  // Validar solapamiento
  const available = await validateSlotAvailable(fecha, horaInicio, duracion);
  if (!available) {
    return { error: "Ya hay una reserva en ese horario. Elige otro." };
  }

  const { error } = await supabase.from("reserva").insert([
    {
      servicio_id: servicioId,
      nombre,
      email,
      telefono,
      fecha_reserva: fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracion,
      observaciones: observaciones || null,
      notas_admin: notasAdmin || null,
      estado,
      origen: "manual",
    },
  ]);

  if (error) {
    console.error("Error al crear reserva manual:", error);
    return { error: "Error al guardar la reserva." };
  }

  revalidateAll();
  return { success: true };
}

// ── Actualizar reserva ──

export async function updateReservation(id: string, formData: FormData) {
  const supabase = await requireAuth();

  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const fecha = formData.get("fecha_reserva") as string;
  const horaInicio = formData.get("hora_inicio") as string;
  const duracionStr = formData.get("duracion_minutos") as string;
  const observaciones = formData.get("observaciones") as string;
  const notasAdmin = formData.get("notas_admin") as string;
  const estado = formData.get("estado") as string;
  const servicioId = formData.get("servicio_id") as string;

  const duracion = parseInt(duracionStr, 10);
  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  // Validar solapamiento (excluyendo la reserva actual)
  if (horaInicio && duracion) {
    const available = await validateSlotAvailable(
      fecha,
      horaInicio,
      duracion,
      id
    );
    if (!available) {
      return { error: "Ese horario se solapa con otra reserva." };
    }
  }

  const { error } = await supabase
    .from("reserva")
    .update({
      servicio_id: servicioId,
      nombre,
      email,
      telefono,
      fecha_reserva: fecha,
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null,
      duracion_minutos: duracion || null,
      observaciones: observaciones || null,
      notas_admin: notasAdmin || null,
      estado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar reserva:", error);
    return { error: "Error al guardar los cambios." };
  }

  revalidateAll();
  return { success: true };
}

// ── Borrado lógico ──

export async function deleteReservation(id: string) {
  const supabase = await requireAuth();

  const { error } = await supabase
    .from("reserva")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar reserva:", error);
    return { error: "Error al eliminar." };
  }

  revalidateAll();
  return { success: true };
}

// ── Bloques ──

export interface ReservationBlock {
  id: string;
  reserva_id: string;
  titulo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  orden: number;
  estado: string;
}

export async function getReservationBlocks(
  reservaId: string
): Promise<ReservationBlock[]> {
  const supabase = await requireAuth();

  const { data } = await supabase
    .from("reserva_bloque")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("orden", { ascending: true });

  return (data as ReservationBlock[]) || [];
}

export async function addReservationBlock(formData: FormData) {
  const supabase = await requireAuth();

  const reservaId = formData.get("reserva_id") as string;
  const titulo = formData.get("titulo") as string;
  const fecha = formData.get("fecha") as string;
  const horaInicio = formData.get("hora_inicio") as string;
  const duracionStr = formData.get("duracion_minutos") as string;
  const duracion = parseInt(duracionStr, 10);
  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  const { error } = await supabase.from("reserva_bloque").insert([
    {
      reserva_id: reservaId,
      titulo,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracion,
    },
  ]);

  if (error) {
    console.error("Error al añadir bloque:", error);
    return { error: "Error al añadir el bloque." };
  }

  revalidateAll();
  return { success: true };
}

export async function deleteReservationBlock(blockId: string) {
  const supabase = await requireAuth();

  const { error } = await supabase
    .from("reserva_bloque")
    .delete()
    .eq("id", blockId);

  if (error) {
    console.error("Error al eliminar bloque:", error);
    return { error: "Error al eliminar." };
  }

  revalidateAll();
  return { success: true };
}
