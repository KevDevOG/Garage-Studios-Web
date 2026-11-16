"use server";

import { getAdminSession } from "@/lib/auth";
import { isUuid, validateBlockInput } from "@/lib/reservation-rules";
import { isValidIsoDate } from "@/lib/dates";
import { revalidatePath } from "next/cache";

export async function createBloqueo(data: {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
}) {
  const { supabase, user } = await getAdminSession();
  if (!user) throw new Error("No autorizado");

  // Validación de servidor: el navegador puede enviar cualquier cosa.
  const parsed = validateBlockInput(data);
  if (!parsed.ok) throw new Error(parsed.error);

  const { error } = await supabase.from("bloqueo_horario").insert([parsed.data]);

  if (error) {
    console.error("Error creating bloqueo:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("No se pudo crear el bloqueo.");
  }

  revalidatePath("/admin/calendario");
  revalidatePath("/reservas"); // Revalidar para que afecte a la disponibilidad pública
}

export async function deleteBloqueo(id: string) {
  const { supabase, user } = await getAdminSession();
  if (!user) throw new Error("No autorizado");
  if (!isUuid(id)) throw new Error("Bloqueo no válido.");

  const { error } = await supabase
    .from("bloqueo_horario")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting bloqueo:", error);
    throw new Error("No se pudo eliminar el bloqueo.");
  }

  revalidatePath("/admin/calendario");
  revalidatePath("/reservas");
}

export async function getBloqueos(startDate: string, endDate: string) {
  const { supabase, user } = await getAdminSession();
  if (!user || !isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return [];

  const { data, error } = await supabase
    .from("bloqueo_horario")
    .select("*")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching bloqueos:", error);
    return [];
  }

  return data || [];
}
