"use server";

import { getAdminSession } from "@/lib/auth";
import { isUuid, validateBlockInput } from "@/lib/reservation-rules";
import { isValidIsoDate } from "@/lib/dates";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";

// Los errores esperados se devuelven como valor (ActionResult): en producción
// Next.js no reenvía al navegador el mensaje de un `throw`.

function revalidateAgenda() {
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/dashboard"); // la pista de "Hoy" pinta los bloqueos
  revalidatePath("/reservas"); // disponibilidad pública
}

export async function createBloqueo(data: {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await getAdminSession();
  if (!user) return actionError("Sesión caducada. Vuelve a iniciar sesión.");

  // Validación de servidor: el navegador puede enviar cualquier cosa.
  const parsed = validateBlockInput(data);
  if (!parsed.ok) return actionError(parsed.error);

  const { error } = await supabase.from("bloqueo_horario").insert([parsed.data]);

  if (error) {
    console.error("Error creating bloqueo:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return actionError("No se pudo crear el bloqueo.");
  }

  revalidateAgenda();
  return actionOk();
}

export async function deleteBloqueo(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAdminSession();
  if (!user) return actionError("Sesión caducada. Vuelve a iniciar sesión.");
  if (!isUuid(id)) return actionError("Bloqueo no válido.");

  const { error } = await supabase
    .from("bloqueo_horario")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting bloqueo:", error);
    return actionError("No se pudo eliminar el bloqueo.");
  }

  revalidateAgenda();
  return actionOk();
}

export async function getBloqueos(startDate: string, endDate: string) {
  const { supabase, user } = await getAdminSession();
  if (!user || !isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return [];

  const { data, error } = await supabase
    .from("bloqueo_horario")
    .select("id, motivo, fecha, hora_inicio, hora_fin")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching bloqueos:", error);
    return [];
  }

  return data || [];
}
