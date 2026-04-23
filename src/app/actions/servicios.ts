"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function ensureAdminExists(supabase: any, user: any) {
  // Verificamos si existe en la tabla administrador
  const { data: admin } = await supabase
    .from("administrador")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) {
    // Si no existe, lo insertamos para evitar el error de Foreign Key
    await supabase.from("administrador").insert([
      {
        id: user.id,
        email: user.email,
        nombre: "Admin",
      },
    ]);
  }
}

export async function toggleServiceActiveAction(id: string, activo: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { error } = await supabase
    .from("servicio")
    .update({ activo })
    .eq("id", id);
    
  if (error) throw new Error("Error al actualizar el estado");

  revalidatePath("/admin/servicios");
}

export async function createServiceAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return { error: "No autorizado" };

  await ensureAdminExists(supabase, user);

  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const precio = parseFloat(formData.get("precio") as string);
  const duracion_minutos = parseInt(
    formData.get("duracion_minutos") as string,
    10
  );
  const categoria = formData.get("categoria") as string;
  const subcategoria = formData.get("subcategoria") as string | null;
  const icono = formData.get("icono") as string || "✅";
  const es_pack = formData.get("es_pack") === "on";

  if (
    !nombre ||
    !descripcion ||
    isNaN(precio) ||
    precio <= 0 ||
    isNaN(duracion_minutos) ||
    duracion_minutos <= 0 ||
    !categoria
  ) {
    return {
      error: "Datos inválidos. Verifica que todos los campos sean correctos y la categoría esté seleccionada.",
    };
  }

  const { error } = await supabase.from("servicio").insert([
    {
      admin_id: user.id,
      nombre,
      descripcion,
      precio,
      duracion_minutos,
      activo: true,
      categoria,
      subcategoria: subcategoria || null,
      icono,
      es_pack,
    },
  ]);

  if (error) {
    console.error("Insert error:", error);
    return { error: "Error al crear el servicio en la base de datos." };
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/reservas"); // Porque el select de reservas se nutre de aquí
  redirect("/admin/servicios");
}

export async function updateServiceAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const nombre = formData.get("nombre") as string;
  const descripcion = formData.get("descripcion") as string;
  const precio = parseFloat(formData.get("precio") as string);
  const duracion_minutos = parseInt(
    formData.get("duracion_minutos") as string,
    10
  );
  const categoria = formData.get("categoria") as string;
  const subcategoria = formData.get("subcategoria") as string | null;
  const icono = formData.get("icono") as string || "✅";
  const es_pack = formData.get("es_pack") === "on";

  if (
    !nombre ||
    !descripcion ||
    isNaN(precio) ||
    precio <= 0 ||
    isNaN(duracion_minutos) ||
    duracion_minutos <= 0 ||
    !categoria
  ) {
    return {
      error: "Datos inválidos. Verifica que todos los campos sean correctos.",
    };
  }

  const { error } = await supabase
    .from("servicio")
    .update({
      nombre,
      descripcion,
      precio,
      duracion_minutos,
      categoria,
      subcategoria: subcategoria || null,
      icono,
      es_pack,
    })
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    return { error: "Error al actualizar el servicio en la base de datos." };
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/reservas");
  redirect("/admin/servicios");
}

export async function deleteServiceAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Comprobar si el servicio tiene reservas asociadas
  const { count, error: countError } = await supabase
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("servicio_id", id);

  if (countError) {
    console.error("Error al contar reservas:", countError);
    return { error: "Error al verificar reservas asociadas." };
  }

  // Si hay al menos una reserva, bloqueamos el borrado
  if (count !== null && count > 0) {
    return {
      error:
        "No se puede eliminar: este servicio tiene reservas asociadas. Puedes cambiar su estado a Inactivo.",
    };
  }

  // Si no hay reservas, procedemos a eliminar
  const { error } = await supabase.from("servicio").delete().eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    return { error: "Error al eliminar el servicio de la base de datos." };
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/reservas");
}
