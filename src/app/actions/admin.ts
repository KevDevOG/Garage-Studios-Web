"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateClienteStats } from "@/app/actions/clientes";
import { 
  sendReservationConfirmationEmail, 
  sendReservationCancelledEmail, 
  sendReservationCompletedEmail 
} from "@/lib/email";

export async function updateReservationStatus(id: string, estado: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  // 1. Obtener el estado actual antes de actualizar
  const { data: currentRes } = await supabase
    .from("reserva")
    .select("estado, email, nombre, fecha_reserva, hora_inicio, hora_fin, precio, confirmacion_email_enviada_at, cancelacion_email_enviada_at, completada_email_enviada_at, calendar_token, servicio(nombre), cliente_id")
    .eq("id", id)
    .single();

  if (!currentRes) throw new Error("Reserva no encontrada");

  // 2. Actualizar el estado en la tabla reserva
  const { error } = await supabase
    .from("reserva")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    throw new Error("Error al actualizar el estado");
  }

  // 3. Recalcular stats del cliente si existe
  if (currentRes.cliente_id) {
    await updateClienteStats(supabase, currentRes.cliente_id);
  }

  const commonEmailData = {
    nombre: currentRes.nombre,
    servicioNombre: (Array.isArray(currentRes.servicio) ? (currentRes.servicio as any)[0]?.nombre : (currentRes.servicio as any)?.nombre) || "Sesión en Garage Studios",
    precio: currentRes.precio,
    fecha: new Date(currentRes.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    horaInicio: currentRes.hora_inicio?.slice(0, 5) || "--:--",
    horaFin: currentRes.hora_fin?.slice(0, 5) || "--:--",
  };

  // 4. Lógica de emails
  if (currentRes.email) {
    // A. Confirmación
    if (estado === "confirmada" && currentRes.estado !== "confirmada" && !currentRes.confirmacion_email_enviada_at) {
      const result = await sendReservationConfirmationEmail(currentRes.email, {
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
      const result = await sendReservationCancelledEmail(currentRes.email, commonEmailData);

      if (result.error) {
        await supabase.from("reserva").update({ email_estado_error: result.error }).eq("id", id);
      } else {
        await supabase.from("reserva").update({ cancelacion_email_enviada_at: new Date().toISOString(), email_estado_error: null }).eq("id", id);
      }
    }

    // C. Completada
    if (estado === "completada" && currentRes.estado !== "completada" && !currentRes.completada_email_enviada_at) {
      const result = await sendReservationCompletedEmail(currentRes.email, commonEmailData);

      if (result.error) {
        await supabase.from("reserva").update({ email_estado_error: result.error }).eq("id", id);
      } else {
        await supabase.from("reserva").update({ completada_email_enviada_at: new Date().toISOString(), email_estado_error: null }).eq("id", id);
      }
    }
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/clientes");
}

export async function markWhatsappAsSent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { error } = await supabase
    .from("reserva")
    .update({ confirmacion_whatsapp_enviada_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("Error al marcar WhatsApp");

  revalidatePath("/admin/calendario");
}

export async function updateContactStatus(id: string, leido: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  const { error } = await supabase
    .from("contacto")
    .update({ leido })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar el estado del mensaje:", error);
    throw new Error("Error al actualizar el estado");
  }

  revalidatePath("/admin/dashboard");
}
