"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateReservationStatus(id: string, estado: string) {
  const supabase = await createClient();

  // Seguridad: Asegurar que quien ejecuta la acción está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  // Actualizar el estado en la tabla reserva
  const { error } = await supabase
    .from("reserva")
    .update({ estado })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    throw new Error("Error al actualizar el estado");
  }

  // Refrescar los datos de la ruta del dashboard
  revalidatePath("/admin/dashboard");
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
