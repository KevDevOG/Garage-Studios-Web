"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBloqueo(data: {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { error } = await supabase.from("bloqueo_horario").insert([
    {
      fecha: data.fecha,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      motivo: data.motivo || null,
    },
  ]);

  if (error) {
    console.error("Error creating bloqueo:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("No se pudo crear el bloqueo.");
  }

  // Auditoría (esto asume que existe una tabla audit_log o similar, si no, lo ignoramos por ahora)
  // await createAuditLog("crear", "bloqueo", { fecha: data.fecha, horas: `${data.hora_inicio}-${data.hora_fin}` });

  revalidatePath("/admin/calendario");
  revalidatePath("/reservas"); // Revalidar para que afecte a la disponibilidad pública
}

export async function deleteBloqueo(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

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
  const supabase = await createClient();
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
