"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BUCKET_NAME = "galeria";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Reutilizamos el mismo helper que en servicios
async function ensureAdminExists(supabase: any, user: any) {
  const { data: admin } = await supabase
    .from("administrador")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) {
    await supabase.from("administrador").insert([
      {
        id: user.id,
        email: user.email,
        nombre: "Admin",
      },
    ]);
  }
}

export async function uploadImageAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  await ensureAdminExists(supabase, user);

  const file = formData.get("archivo") as File;
  const titulo = formData.get("titulo") as string;
  const descripcion = (formData.get("descripcion") as string) || "";

  // Validaciones
  if (!file || !file.size) {
    return { error: "Debes seleccionar una imagen." };
  }

  if (!titulo || titulo.trim().length === 0) {
    return { error: "El título es obligatorio." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      error: "Formato no permitido. Solo se aceptan: JPG, PNG, WebP y GIF.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "La imagen es demasiado grande. Máximo 5 MB." };
  }

  // Generar nombre único para evitar colisiones
  const extension = file.name.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  // Convertir File a ArrayBuffer (más fiable en Server Actions de Next.js)
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  // Subir al Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return {
      error: `Error al subir la imagen: ${uploadError.message}`,
    };
  }

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uniqueName);

  // Insertar registro en la tabla imagen
  const { error: dbError } = await supabase.from("imagen").insert([
    {
      admin_id: user.id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      url_imagen: publicUrl,
    },
  ]);

  if (dbError) {
    console.error("DB insert error:", dbError);
    // Intentar limpiar el archivo subido si falla el insert
    await supabase.storage.from(BUCKET_NAME).remove([uniqueName]);
    return { error: "Error al guardar la imagen en la base de datos." };
  }

  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
  redirect("/admin/galeria");
}

export async function updateImageAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const titulo = formData.get("titulo") as string;
  const descripcion = (formData.get("descripcion") as string) || "";

  if (!titulo || titulo.trim().length === 0) {
    return { error: "El título es obligatorio." };
  }

  const { error } = await supabase
    .from("imagen")
    .update({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
    })
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    return { error: "Error al actualizar la imagen." };
  }

  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
  redirect("/admin/galeria");
}

export async function deleteImageAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Obtener la URL de la imagen para saber qué archivo borrar del Storage
  const { data: imagen, error: fetchError } = await supabase
    .from("imagen")
    .select("url_imagen")
    .eq("id", id)
    .single();

  if (fetchError || !imagen) {
    return { error: "No se encontró la imagen." };
  }

  // Extraer el nombre del archivo de la URL pública
  // La URL tiene este formato: .../storage/v1/object/public/galeria/FILENAME
  const urlParts = imagen.url_imagen.split(`/${BUCKET_NAME}/`);
  const filePath = urlParts[urlParts.length - 1];

  if (filePath) {
    // Primero borrar del Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continuamos igualmente para borrar el registro de la DB
    }
  }

  // Después borrar el registro de la tabla
  const { error: dbError } = await supabase
    .from("imagen")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("DB delete error:", dbError);
    return { error: "Error al eliminar la imagen de la base de datos." };
  }

  revalidatePath("/admin/galeria");
  revalidatePath("/galeria");
}
