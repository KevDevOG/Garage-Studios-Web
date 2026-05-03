"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes } from "@/lib/schedule";
import { findOrCreateClientePublic, updateClienteStats } from "@/app/actions/clientes";
import { sendReservationConfirmationEmail } from "@/lib/email";

// ── Helpers ──

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

function revalidateAll(id?: string) {
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/dashboard");
  if (id) {
    revalidatePath(`/admin/calendario/${id}`);
  }
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
  precio: number | null;
  cliente_id?: string | null;
  cliente_total_reservas?: number;
  servicio?: { nombre: string; precio?: number } | null;

  // Campos opcionales para mostrar bloques en el calendario
  is_block?: boolean;
  block_title?: string;
  parent_reserva_id?: string;

  // Confirmaciones
  confirmacion_email_enviada_at?: string | null;
  confirmacion_whatsapp_enviada_at?: string | null;
  confirmacion_error?: string | null;
  calendar_token?: string | null;
}

// ── Obtener reservas en rango ──

export async function getReservations(
  startDate: string,
  endDate: string
): Promise<ReservationRow[]> {
  const supabase = await requireAuth();

  const { data, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre), cliente:cliente_id(total_reservas)")
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
  const precio = parseFloat(formData.get("precio") as string);
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

  // Crear o encontrar cliente
  const clienteId = await findOrCreateClientePublic(supabase, {
    nombre,
    email,
    telefono,
    origen: "manual",
  });

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
      precio: isNaN(precio) ? null : precio,
      origen: "manual",
      cliente_id: clienteId,
    },
  ]);

  if (error) {
    console.error("Error al crear reserva manual:", error);
    return { error: "Error al guardar la reserva." };
  }

  await updateClienteStats(supabase, clienteId);
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
  const precio = parseFloat(formData.get("precio") as string);

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

  // 1. Obtener estado previo antes de actualizar
  const { data: currentRes } = await supabase
    .from("reserva")
    .select("estado, confirmacion_email_enviada_at, servicio(nombre)")
    .eq("id", id)
    .single();

  if (!currentRes) return { error: "Reserva no encontrada." };

  // 2. Actualizar la reserva
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
      precio: isNaN(precio) ? null : precio,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar reserva:", error);
    return { error: "Error al guardar los cambios." };
  }

  // 3. Recalcular stats del cliente si existe
  const { data: resData } = await supabase
    .from("reserva")
    .select("cliente_id")
    .eq("id", id)
    .single();
  if (resData?.cliente_id) {
    await updateClienteStats(supabase, resData.cliente_id);
  }

  // 4. Lógica de email: Solo si pasa a "confirmada" por primera vez y tiene email
  if (
    estado === "confirmada" &&
    currentRes.estado !== "confirmada" &&
    !currentRes.confirmacion_email_enviada_at &&
    email
  ) {
    const emailResult = await sendReservationConfirmationEmail(email, {
      nombre,
      servicioNombre: (Array.isArray(currentRes.servicio) ? currentRes.servicio[0]?.nombre : (currentRes.servicio as any)?.nombre) || "Sesión en Garage Studios",
      fecha: new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      horaInicio: horaInicio || "--:--",
      horaFin: horaFin || "--:--",
    });

    if (emailResult.error) {
      await supabase
        .from("reserva")
        .update({ confirmacion_error: emailResult.error })
        .eq("id", id);
    } else {
      await supabase
        .from("reserva")
        .update({ confirmacion_email_enviada_at: new Date().toISOString() })
        .eq("id", id);
    }
  }

  revalidateAll(id);
  return { success: true };
}

// ── Borrado lógico ──

export async function deleteReservation(id: string) {
  const supabase = await requireAuth();

  // Obtener cliente_id antes del borrado lógico
  const { data: resData } = await supabase
    .from("reserva")
    .select("cliente_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("reserva")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar reserva:", error);
    return { error: "Error al eliminar." };
  }

  // Recalcular stats del cliente
  if (resData?.cliente_id) {
    await updateClienteStats(supabase, resData.cliente_id);
  }

  revalidateAll(id);
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

  revalidateAll(reservaId);
  return { success: true };
}

export async function deleteReservationBlock(blockId: string) {
  const supabase = await requireAuth();

  // Obtener el reserva_id antes de borrar para revalidar
  const { data: block } = await supabase
    .from("reserva_bloque")
    .select("reserva_id")
    .eq("id", blockId)
    .single();

  const { error } = await supabase
    .from("reserva_bloque")
    .delete()
    .eq("id", blockId);

  if (error) {
    console.error("Error al eliminar bloque:", error);
    return { error: "Error al eliminar." };
  }

  if (block?.reserva_id) {
    revalidateAll(block.reserva_id);
  } else {
    revalidateAll();
  }
  
  return { success: true };
}
