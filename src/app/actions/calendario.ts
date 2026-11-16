"use server";

import { revalidatePath } from "next/cache";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes, formatTime } from "@/lib/schedule";
import { findOrCreateClientePublic, updateClienteStats } from "@/lib/cliente-repo";
import {
  sendReservationConfirmationEmail,
  sendReservationCancelledEmail,
  sendReservationCompletedEmail,
} from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { formatIsoDateEs, isValidIsoDate, isValidTime } from "@/lib/dates";
import { isUuid, isValidEmail, isValidPhone } from "@/lib/reservation-rules";
import { isPaymentState, isReservationState } from "@/lib/reservation-states";

// ── Helpers ──

async function requireAuth() {
  const { supabase } = await requireAdmin();
  return supabase;
}

/** Lee un campo de texto del FormData ya recortado. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Valida los datos comunes de una reserva creada o editada desde el panel. */
function validateAdminReservationFields(formData: FormData): { error: string } | null {
  const nombre = field(formData, "nombre");
  if (nombre.length < 2 || nombre.length > 120) return { error: "El nombre es obligatorio (2-120 caracteres)." };

  const email = field(formData, "email");
  if (email && !isValidEmail(email)) return { error: "El email no es válido." };

  const telefono = field(formData, "telefono");
  if (telefono && !isValidPhone(telefono)) return { error: "El teléfono no es válido (mínimo 9 dígitos)." };

  const servicioId = field(formData, "servicio_id");
  if (!isUuid(servicioId)) return { error: "Selecciona un servicio válido." };

  const fecha = field(formData, "fecha_reserva");
  if (!isValidIsoDate(fecha)) return { error: "La fecha no es válida." };

  const horaInicio = field(formData, "hora_inicio");
  if (horaInicio && !isValidTime(horaInicio)) return { error: "La hora de inicio no es válida." };

  const duracion = Number.parseInt(field(formData, "duracion_minutos"), 10);
  if (horaInicio && (!Number.isFinite(duracion) || duracion <= 0 || duracion > 24 * 60)) {
    return { error: "La duración debe estar entre 1 y 1440 minutos." };
  }
  if (horaInicio && Number.isFinite(duracion) && timeToMinutes(horaInicio) + duracion > 24 * 60) {
    return { error: "La sesión no puede terminar después de medianoche." };
  }

  const precioRaw = field(formData, "precio");
  if (precioRaw) {
    const precio = Number.parseFloat(precioRaw);
    if (!Number.isFinite(precio) || precio < 0) return { error: "El precio debe ser un número positivo." };
  }

  return null;
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
  cancelacion_email_enviada_at?: string | null;
  completada_email_enviada_at?: string | null;
  email_estado_error?: string | null;
  calendar_token?: string | null;

  // Campos de pago (Phase 2)
  estado_pago?: "pendiente" | "parcial" | "pagado";
  importe_pagado?: number;
  pagado_at?: string | null;
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

  const invalid = validateAdminReservationFields(formData);
  if (invalid) return invalid;

  const servicioId = field(formData, "servicio_id");
  const nombre = field(formData, "nombre");
  const email = field(formData, "email");
  const telefono = field(formData, "telefono");
  const fecha = field(formData, "fecha_reserva");
  const horaInicio = field(formData, "hora_inicio");
  const observaciones = field(formData, "observaciones");
  const notasAdmin = field(formData, "notas_admin");
  const precio = Number.parseFloat(field(formData, "precio"));
  const estado = "pendiente"; // Siempre se crea como pendiente para que el flujo de email funcione al confirmar

  if (!horaInicio) return { error: "La hora de inicio es obligatoria." };
  const duracion = Number.parseInt(field(formData, "duracion_minutos"), 10);
  if (!Number.isFinite(duracion) || duracion <= 0) {
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
    if (error.code === "23P01" || error.message?.includes("reserva_no_overlap")) {
      return { error: "Ya hay una reserva en ese horario. Elige otro." };
    }
    return { error: "Error al guardar la reserva." };
  }

  await updateClienteStats(supabase, clienteId);

  await createAuditLog({
    accion: "creación",
    entidad: "reserva",
    descripcion: `Reserva manual creada para ${nombre} (${fecha} ${horaInicio})`,
    metadata: { servicio_id: servicioId, cliente_id: clienteId, fecha, hora_inicio: horaInicio, estado },
  });

  revalidateAll();
  return { success: true };
}

// ── Actualizar reserva ──

export async function updateReservation(id: string, formData: FormData) {
  if (!isUuid(id)) return { error: "Reserva no válida." };
  const supabase = await requireAuth();

  const invalid = validateAdminReservationFields(formData);
  if (invalid) return invalid;

  const nombre = field(formData, "nombre");
  const email = field(formData, "email");
  const telefono = field(formData, "telefono");
  const fecha = field(formData, "fecha_reserva");
  const horaInicio = field(formData, "hora_inicio");
  const observaciones = field(formData, "observaciones");
  const notasAdmin = field(formData, "notas_admin");
  const estado = field(formData, "estado");
  const servicioId = field(formData, "servicio_id");
  const precio = Number.parseFloat(field(formData, "precio"));
  const estadoPago = field(formData, "estado_pago");
  const importePagado = Number.parseFloat(field(formData, "importe_pagado"));

  if (!isReservationState(estado)) return { error: "Estado de reserva no válido." };
  if (!isPaymentState(estadoPago)) return { error: "Estado de pago no válido." };
  if (!Number.isNaN(importePagado) && importePagado < 0) return { error: "El importe pagado no puede ser negativo." };

  const duracion = Number.parseInt(field(formData, "duracion_minutos"), 10);

  // Una reserva que ocupa agenda (pendiente/confirmada) necesita hora y duración:
  // con horas NULL la restricción de exclusión trabajaría con rangos infinitos.
  if ((estado === "pendiente" || estado === "confirmada") && (!horaInicio || !Number.isFinite(duracion) || duracion <= 0)) {
    return { error: "Una reserva pendiente o confirmada necesita hora de inicio y duración." };
  }
  const horaFin = horaInicio && Number.isFinite(duracion)
    ? minutesToTime(timeToMinutes(horaInicio) + duracion)
    : "";

  // 1. Obtener la reserva actual antes de actualizar
  const { data: currentRes } = await supabase
    .from("reserva")
    .select("fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, confirmacion_email_enviada_at, cancelacion_email_enviada_at, completada_email_enviada_at, calendar_token, servicio(nombre)")
    .eq("id", id)
    .single();

  if (!currentRes) return { error: "Reserva no encontrada." };

  // Normalizar horas (HH:mm) para comparar fielmente
  const currentHoraInicio = currentRes.hora_inicio?.slice(0, 5) || "";
  const submittedHoraInicio = horaInicio?.slice(0, 5) || "";
  const currentDuracion = currentRes.duracion_minutos || 0;
  const submittedDuracion = isNaN(duracion) ? 0 : duracion;

  const scheduleChanged =
    currentRes.fecha_reserva !== fecha ||
    currentHoraInicio !== submittedHoraInicio ||
    currentDuracion !== submittedDuracion;

  // Solo validar solapamiento si la fecha, hora de inicio o duración han cambiado
  if (scheduleChanged && horaInicio && duracion) {
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
      estado_pago: estadoPago,
      importe_pagado: isNaN(importePagado) ? 0 : importePagado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar reserva:", error);
    if (error.code === "23P01" || error.message?.includes("reserva_no_overlap")) {
      return { error: "Ese horario se solapa con otra reserva." };
    }
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

  const servicioJoin = currentRes.servicio as { nombre: string } | { nombre: string }[] | null;
  const servicioNombre =
    (Array.isArray(servicioJoin) ? servicioJoin[0]?.nombre : servicioJoin?.nombre) || "Sesión en Garage Studios";

  const commonEmailData = {
    nombre,
    servicioNombre,
    precio: Number.isNaN(precio) ? currentRes.precio : precio,
    fecha: formatIsoDateEs(fecha),
    horaInicio: formatTime(horaInicio || null),
    horaFin: formatTime(horaFin || null),
  };

  // 4. Lógica de emails
  if (email) {
    // A. Confirmación
    if (estado === "confirmada" && currentRes.estado !== "confirmada" && !currentRes.confirmacion_email_enviada_at) {
      const result = await sendReservationConfirmationEmail(email, {
        ...commonEmailData,
        calendarToken: currentRes.calendar_token || undefined,
      });

      if (result.error) {
        await supabase.from("reserva").update({ confirmacion_error: result.error }).eq("id", id);
      } else {
        await supabase.from("reserva").update({ confirmacion_email_enviada_at: new Date().toISOString(), confirmacion_error: null }).eq("id", id);
      }
    }

    // B. Cancelación
    if (estado === "cancelada" && currentRes.estado !== "cancelada" && !currentRes.cancelacion_email_enviada_at) {
      const result = await sendReservationCancelledEmail(email, commonEmailData);

      if (result.error) {
        await supabase.from("reserva").update({ email_estado_error: result.error }).eq("id", id);
      } else {
        await supabase.from("reserva").update({ cancelacion_email_enviada_at: new Date().toISOString(), email_estado_error: null }).eq("id", id);
      }
    }

    // C. Completada
    if (estado === "completada" && currentRes.estado !== "completada" && !currentRes.completada_email_enviada_at) {
      const result = await sendReservationCompletedEmail(email, commonEmailData);

      if (result.error) {
        await supabase.from("reserva").update({ email_estado_error: result.error }).eq("id", id);
      } else {
        await supabase.from("reserva").update({ completada_email_enviada_at: new Date().toISOString(), email_estado_error: null }).eq("id", id);
      }
    }
  }

  await createAuditLog({
    accion: currentRes.estado !== estado ? "cambio_estado" : "edición",
    entidad: "reserva",
    entidad_id: id,
    descripcion: currentRes.estado !== estado
      ? `Reserva ${id.slice(0, 8)}… → ${estado} (antes: ${currentRes.estado})`
      : `Reserva ${id.slice(0, 8)}… editada`,
    metadata: { estado_anterior: currentRes.estado, estado_nuevo: estado },
  });

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

  await createAuditLog({
    accion: "eliminación",
    entidad: "reserva",
    entidad_id: id,
    descripcion: `Reserva ${id.slice(0, 8)}… eliminada (borrado lógico)`,
  });

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

  const reservaId = field(formData, "reserva_id");
  const titulo = field(formData, "titulo");
  const fecha = field(formData, "fecha");
  const horaInicio = field(formData, "hora_inicio");
  const duracion = Number.parseInt(field(formData, "duracion_minutos"), 10);

  if (!isUuid(reservaId)) return { error: "Reserva no válida." };
  if (titulo.length < 1 || titulo.length > 120) return { error: "El título del bloque es obligatorio." };
  if (!isValidIsoDate(fecha)) return { error: "La fecha del bloque no es válida." };
  if (!isValidTime(horaInicio)) return { error: "La hora de inicio del bloque no es válida." };
  if (!Number.isFinite(duracion) || duracion <= 0) return { error: "La duración del bloque debe ser mayor que cero." };
  if (timeToMinutes(horaInicio) + duracion > 24 * 60) {
    return { error: "El bloque no puede terminar después de medianoche." };
  }

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
