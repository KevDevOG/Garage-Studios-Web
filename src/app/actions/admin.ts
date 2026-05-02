"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateClienteStats } from "@/app/actions/clientes";

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
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    throw new Error("Error al actualizar el estado");
  }

  // Recalcular stats del cliente si existe
  const { data: resData } = await supabase
    .from("reserva")
    .select("cliente_id")
    .eq("id", id)
    .single();
  if (resData?.cliente_id) {
    await updateClienteStats(supabase, resData.cliente_id);
  }

  // Refrescar los datos de las rutas relevantes
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/clientes");
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
