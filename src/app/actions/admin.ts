"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { updateClienteStats } from "@/app/actions/clientes";
import {
  sendReservationConfirmationEmail,
  sendReservationCancelledEmail,
  sendReservationCompletedEmail,
} from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { formatIsoDateEs, isValidIsoDate } from "@/lib/dates";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/schedule";
import { isUuid } from "@/lib/reservation-rules";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { isPaymentState, isReservationState, type PaymentState } from "@/lib/reservation-states";

function unauthorizedOrGeneric(err: unknown, generic: string): ActionResult {
  if (err instanceof UnauthorizedError) return actionError("Sesión caducada. Vuelve a iniciar sesión.");
  console.error(generic, err);
  return actionError(generic);
}

type ServicioJoin = { nombre: string } | { nombre: string }[] | null;

function servicioNombre(servicio: ServicioJoin): string {
  if (!servicio) return "Sesión en Garage Studios";
  if (Array.isArray(servicio)) return servicio[0]?.nombre || "Sesión en Garage Studios";
  return servicio.nombre || "Sesión en Garage Studios";
}

/**
 * Cambia el estado de una reserva y envía el email correspondiente una sola
 * vez por transición (confirmada / cancelada / completada).
 */
export async function updateReservationStatus(id: string, estado: string): Promise<ActionResult> {
  if (!isUuid(id)) return actionError("Reserva no válida.");
  if (!isReservationState(estado)) return actionError("Estado no válido.");

  try {
    const { supabase } = await requireAdmin();

    // 1. Estado actual antes de actualizar
    const { data: currentRes } = await supabase
      .from("reserva")
      .select(
        "estado, email, nombre, fecha_reserva, hora_inicio, hora_fin, precio, confirmacion_email_enviada_at, cancelacion_email_enviada_at, completada_email_enviada_at, calendar_token, servicio(nombre), cliente_id"
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!currentRes) return actionError("Reserva no encontrada.");
    if (currentRes.estado === estado) return actionOk();

    // 2. Actualizar
    const { error } = await supabase
      .from("reserva")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar el estado de la reserva:", error);
      if (error.code === "23P01" || error.message?.includes("reserva_no_overlap")) {
        return actionError("No se puede activar: el horario se solapa con otra reserva activa.");
      }
      return actionError("No se pudo actualizar el estado.");
    }

    // 3. Recalcular stats del cliente
    if (currentRes.cliente_id) {
      await updateClienteStats(supabase, currentRes.cliente_id);
    }

    // 4. Emails (una vez por transición)
    if (currentRes.email) {
      const commonEmailData = {
        nombre: currentRes.nombre,
        servicioNombre: servicioNombre(currentRes.servicio as ServicioJoin),
        precio: currentRes.precio,
        fecha: formatIsoDateEs(currentRes.fecha_reserva),
        horaInicio: formatTime(currentRes.hora_inicio),
        horaFin: formatTime(currentRes.hora_fin),
      };

      if (estado === "confirmada" && !currentRes.confirmacion_email_enviada_at) {
        const result = await sendReservationConfirmationEmail(currentRes.email, {
          ...commonEmailData,
          calendarToken: currentRes.calendar_token || undefined,
        });
        await supabase
          .from("reserva")
          .update(
            result.error
              ? { confirmacion_error: result.error }
              : { confirmacion_email_enviada_at: new Date().toISOString(), confirmacion_error: null }
          )
          .eq("id", id);
      }

      if (estado === "cancelada" && !currentRes.cancelacion_email_enviada_at) {
        const result = await sendReservationCancelledEmail(currentRes.email, commonEmailData);
        await supabase
          .from("reserva")
          .update(
            result.error
              ? { email_estado_error: result.error }
              : { cancelacion_email_enviada_at: new Date().toISOString(), email_estado_error: null }
          )
          .eq("id", id);
      }

      if (estado === "completada" && !currentRes.completada_email_enviada_at) {
        const result = await sendReservationCompletedEmail(currentRes.email, commonEmailData);
        await supabase
          .from("reserva")
          .update(
            result.error
              ? { email_estado_error: result.error }
              : { completada_email_enviada_at: new Date().toISOString(), email_estado_error: null }
          )
          .eq("id", id);
      }
    }

    await createAuditLog({
      accion: "cambio_estado",
      entidad: "reserva",
      entidad_id: id,
      descripcion: `Reserva de ${currentRes.nombre} → ${estado} (antes: ${currentRes.estado})`,
      metadata: { estado_anterior: currentRes.estado, estado_nuevo: estado },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/calendario");
    revalidatePath(`/admin/calendario/${id}`);
    revalidatePath("/admin/clientes");
    return actionOk();
  } catch (err) {
    return unauthorizedOrGeneric(err, "No se pudo actualizar el estado de la reserva.");
  }
}

export async function markWhatsappAsSent(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return actionError("Reserva no válida.");
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("reserva")
      .update({ confirmacion_whatsapp_enviada_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return actionError("No se pudo marcar el WhatsApp como enviado.");

    revalidatePath("/admin/calendario");
    revalidatePath(`/admin/calendario/${id}`);
    return actionOk();
  } catch (err) {
    return unauthorizedOrGeneric(err, "No se pudo marcar el WhatsApp como enviado.");
  }
}

export async function updateContactStatus(id: string, leido: boolean): Promise<ActionResult> {
  if (!isUuid(id)) return actionError("Mensaje no válido.");
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("contacto").update({ leido: Boolean(leido) }).eq("id", id);

    if (error) {
      console.error("Error al actualizar el estado del mensaje:", error);
      return actionError("No se pudo actualizar el mensaje.");
    }

    revalidatePath("/admin/dashboard");
    return actionOk();
  } catch (err) {
    return unauthorizedOrGeneric(err, "No se pudo actualizar el mensaje.");
  }
}

export async function rescheduleReservation(
  id: string,
  newDate: string,
  newStartTime: string
): Promise<ActionResult> {
  if (!isUuid(id)) return actionError("Reserva no válida.");
  if (!isValidIsoDate(newDate)) return actionError("Fecha no válida.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(newStartTime)) return actionError("Hora no válida.");

  try {
    const { supabase } = await requireAdmin();

    const { data: res } = await supabase
      .from("reserva")
      .select("duracion_minutos, estado")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!res) return actionError("Reserva no encontrada.");
    const duracion = Number(res.duracion_minutos);
    if (!Number.isFinite(duracion) || duracion <= 0) return actionError("La reserva no tiene duración definida.");

    const newEndTime = minutesToTime(timeToMinutes(newStartTime) + duracion);

    const { validateSlotAvailable } = await import("@/app/actions/availability");
    const isAvailable = await validateSlotAvailable(newDate, newStartTime, duracion, id);
    if (!isAvailable) return actionError("El nuevo horario seleccionado no está disponible.");

    const { error } = await supabase
      .from("reserva")
      .update({
        fecha_reserva: newDate,
        hora_inicio: newStartTime,
        hora_fin: newEndTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error rescheduling:", error);
      if (error.code === "23P01") return actionError("El nuevo horario se solapa con otra reserva.");
      return actionError("No se pudo reprogramar la reserva.");
    }

    await createAuditLog({
      accion: "edición",
      entidad: "reserva",
      entidad_id: id,
      descripcion: `Reserva reprogramada a ${newDate} ${newStartTime}`,
      metadata: { fecha: newDate, hora_inicio: newStartTime },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/calendario");
    revalidatePath(`/admin/calendario/${id}`);
    return actionOk();
  } catch (err) {
    return unauthorizedOrGeneric(err, "No se pudo reprogramar la reserva.");
  }
}

export async function updateReservationPayment(
  id: string,
  data: { estado_pago: PaymentState; importe_pagado: number }
): Promise<ActionResult> {
  if (!isUuid(id)) return actionError("Reserva no válida.");
  if (!isPaymentState(data.estado_pago)) {
    return actionError("Estado de pago no válido.");
  }
  const importe = Number(data.importe_pagado);
  if (!Number.isFinite(importe) || importe < 0) return actionError("El importe pagado debe ser un número positivo.");

  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("reserva")
      .update({
        estado_pago: data.estado_pago,
        importe_pagado: importe,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating payment status:", error);
      return actionError("No se pudo actualizar el pago.");
    }

    await createAuditLog({
      accion: "edición",
      entidad: "reserva",
      entidad_id: id,
      descripcion: `Actualizado pago: ${data.estado_pago} (${importe}€)`,
      metadata: { estado_pago: data.estado_pago, importe_pagado: importe },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/calendario");
    revalidatePath("/admin/finanzas");
    return actionOk();
  } catch (err) {
    return unauthorizedOrGeneric(err, "No se pudo actualizar el pago.");
  }
}
