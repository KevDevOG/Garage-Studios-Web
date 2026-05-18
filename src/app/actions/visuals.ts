"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface VisualImage {
  id: string;
  titulo: string;
  descripcion: string | null;
  url_imagen: string;
  tipo: "fotos" | "grabaciones" | "rodajes";
  destacado: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
}

/**
 * Obtener imágenes para el frontend público de /visuals
 * (activo = true, ordenado por destacado, orden, y fecha)
 */
export async function getVisualsImages(): Promise<VisualImage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visuals_imagen")
    .select("*")
    .eq("activo", true)
    .is("deleted_at", null)
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo imágenes de Visuals:", error);
    return [];
  }

  return data as VisualImage[];
}

/**
 * Obtener todas las imágenes para /admin/visuals
 * (incluyendo inactivas, pero no borradas lógicamente)
 */
export async function getAdminVisualsImages(): Promise<VisualImage[]> {
  const supabase = await createClient();

  // Verificamos si el usuario es admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const { data, error } = await supabase
    .from("visuals_imagen")
    .select("*")
    .is("deleted_at", null)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo imágenes admin de Visuals:", error);
    return [];
  }

  return data as VisualImage[];
}

/**
 * Obtener una imagen específica (para edición)
 */
export async function getVisualsImageById(id: string): Promise<VisualImage | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const { data, error } = await supabase
    .from("visuals_imagen")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error obteniendo imagen de Visuals:", error);
    return null;
  }

  return data as VisualImage;
}

/**
 * Helper para subir archivo a Supabase Storage bucket 'garage-visuals'
 */
async function uploadToStorage(file: File): Promise<string> {
  const supabase = await createClient();
  
  // Validar tamaño
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen supera el tamaño máximo permitido de 5 MB");
  }

  // Validar tipo
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato de imagen no permitido. Usa JPG, PNG o WEBP.");
  }

  // Obtener extensión y generar nombre seguro
  const fileExt = file.name.split('.').pop() || 'jpg';
  const randomId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const path = `visuals/${randomId}.${fileExt}`;

  // Convertir file a buffer para subirlo robustamente en server action
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase.storage
    .from("garage-visuals")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    console.error("Error subiendo a Storage:", error);
    throw new Error(`Error de Storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("garage-visuals")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

/**
 * Crear nueva imagen de Garage Visuals
 */
export async function createVisualsImage(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as string;
    const orden = parseInt(formData.get("orden") as string) || 999;
    const destacado = formData.get("destacado") === "on";
    const activo = formData.get("activo") === "on";

    // Procesar archivo si se seleccionó
    const file = formData.get("imagen_archivo") as File | null;
    let url_imagen = formData.get("url_imagen") as string;

    if (file && file.size > 0) {
      try {
        url_imagen = await uploadToStorage(file);
      } catch (uploadError: any) {
        return { success: false, error: uploadError.message };
      }
    }

    const finalTitulo = titulo && titulo.trim() ? titulo.trim() : null;

    if (!url_imagen) {
      return { success: false, error: "Debes subir una imagen o introducir una URL manual" };
    }

    const { data: newImage, error } = await supabase
      .from("visuals_imagen")
      .insert({
        titulo: finalTitulo,
        descripcion: descripcion || null,
        url_imagen,
        tipo,
        orden,
        destacado,
        activo
      })
      .select("id")
      .single();

    if (error) throw error;

    // Log de auditoría
    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "CREATE",
        table_name: "visuals_imagen",
        record_id: newImage.id,
        details: { action: "Crear imagen en galería Visuals", titulo }
      });
    } catch (auditError) {
      console.error("Error en audit_log:", auditError);
    }

    revalidatePath("/visuals");
    revalidatePath("/admin/visuals");
    return { success: true };
  } catch (err: any) {
    console.error("Error en createVisualsImage:", err);
    return { success: false, error: err.message || "Error al crear imagen" };
  }
}

/**
 * Crear múltiples imágenes de Garage Visuals (Subida Múltiple)
 */
export async function createVisualsImages(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as string;
    const orden = parseInt(formData.get("orden") as string) || 999;
    const destacado = formData.get("destacado") === "on";
    const activo = formData.get("activo") === "on";

    // Obtener todos los archivos del input multiple
    const files = formData.getAll("imagen_archivos") as File[];
    const validFiles = files.filter(f => f.name && f.size > 0);

    if (validFiles.length > 0) {
      // 1. Validar cantidad máxima (20)
      if (validFiles.length > 20) {
        return { success: false, error: "Puedes subir un máximo de 20 imágenes a la vez." };
      }

      const uploadedPaths: string[] = [];
      const urls: string[] = [];
      const fileNames: string[] = [];

      try {
        for (const file of validFiles) {
          // 2. Validar tamaño por archivo (5 MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`El archivo "${file.name}" supera el tamaño máximo permitido de 5 MB.`);
          }

          // 3. Validar tipo
          const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`Formato de imagen no permitido para "${file.name}". Usa JPG, PNG o WEBP.`);
          }

          // Generar nombre seguro
          const fileExt = file.name.split('.').pop() || 'jpg';
          const randomId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
          const path = `visuals/${randomId}.${fileExt}`;

          const buffer = Buffer.from(await file.arrayBuffer());

          const { error: uploadError } = await supabase.storage
            .from("garage-visuals")
            .upload(path, buffer, {
              contentType: file.type,
              upsert: true
            });

          if (uploadError) {
            throw new Error(`Error al subir "${file.name}": ${uploadError.message}`);
          }

          uploadedPaths.push(path);
          const { data: publicUrlData } = supabase.storage
            .from("garage-visuals")
            .getPublicUrl(path);

          urls.push(publicUrlData.publicUrl);
          fileNames.push(file.name);
        }
      } catch (uploadError: any) {
        // Limpiar archivos subidos en caso de error
        if (uploadedPaths.length > 0) {
          try {
            await supabase.storage.from("garage-visuals").remove(uploadedPaths);
          } catch (cleanupErr) {
            console.error("Error al limpiar archivos tras fallo:", cleanupErr);
          }
        }
        return { success: false, error: uploadError.message };
      }

      // 4. Crear los registros en la base de datos
      const recordsToInsert = urls.map((url, idx) => {
        let itemTitulo = titulo ? titulo.trim() : "";
        if (validFiles.length > 1 && itemTitulo) {
          itemTitulo = `${itemTitulo} ${idx + 1}`;
        }
        
        // Si no hay título, guardar como null
        const finalTitulo = itemTitulo || null;

        return {
          titulo: finalTitulo,
          descripcion: descripcion || null,
          url_imagen: url,
          tipo,
          orden: orden + idx,
          destacado,
          activo
        };
      });

      const { data: newImages, error: insertError } = await supabase
        .from("visuals_imagen")
        .insert(recordsToInsert)
        .select("id");

      if (insertError) {
        // Intentar limpiar storage si falla inserción en DB
        try {
          await supabase.storage.from("garage-visuals").remove(uploadedPaths);
        } catch (cleanupErr) {
          console.error("Error al limpiar archivos tras fallo en DB:", cleanupErr);
        }
        throw insertError;
      }

      // Audit Log
      try {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          action: "CREATE",
          table_name: "visuals_imagen",
          record_id: newImages[0]?.id,
          details: { action: `Se subieron ${recordsToInsert.length} imágenes a Garage Visuals`, cantidad: recordsToInsert.length }
        });
      } catch (auditError) {
        console.error("Error en audit_log:", auditError);
      }

    } else {
      // 5. Caso URL Manual
      let url_imagen = formData.get("url_imagen") as string;
      if (!url_imagen || !url_imagen.trim()) {
        return { success: false, error: "Debes seleccionar uno o más archivos o introducir una URL manual" };
      }

      const finalTitulo = titulo && titulo.trim() ? titulo.trim() : null;

      const { data: newImage, error: insertError } = await supabase
        .from("visuals_imagen")
        .insert({
          titulo: finalTitulo,
          descripcion: descripcion || null,
          url_imagen: url_imagen.trim(),
          tipo,
          orden,
          destacado,
          activo
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Audit Log
      try {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          action: "CREATE",
          table_name: "visuals_imagen",
          record_id: newImage.id,
          details: { action: "Crear imagen en galería Visuals desde URL", titulo: finalTitulo }
        });
      } catch (auditError) {
        console.error("Error en audit_log:", auditError);
      }
    }

    revalidatePath("/visuals");
    revalidatePath("/admin/visuals");
    return { success: true };
  } catch (err: any) {
    console.error("Error en createVisualsImages:", err);
    return { success: false, error: err.message || "Error al subir lote de imágenes" };
  }
}

/**
 * Actualizar imagen de Garage Visuals
 */
export async function updateVisualsImage(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const tipo = formData.get("tipo") as string;
    const orden = parseInt(formData.get("orden") as string) || 999;
    const destacado = formData.get("destacado") === "on";
    const activo = formData.get("activo") === "on";

    // Procesar archivo si se seleccionó
    const file = formData.get("imagen_archivo") as File | null;
    let url_imagen = formData.get("url_imagen") as string;

    if (file && file.size > 0) {
      try {
        url_imagen = await uploadToStorage(file);
      } catch (uploadError: any) {
        return { success: false, error: uploadError.message };
      }
    }

    if (!titulo) {
      return { success: false, error: "El título es obligatorio" };
    }

    if (!url_imagen) {
      return { success: false, error: "Debes subir una imagen o introducir una URL manual" };
    }

    const { error } = await supabase
      .from("visuals_imagen")
      .update({
        titulo,
        descripcion: descripcion || null,
        url_imagen,
        tipo,
        orden,
        destacado,
        activo,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;

    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "UPDATE",
        table_name: "visuals_imagen",
        record_id: id,
        details: { action: "Actualizar imagen de Visuals", titulo }
      });
    } catch (auditError) {
      console.error("Error en audit_log:", auditError);
    }

    revalidatePath("/visuals");
    revalidatePath("/admin/visuals");
    return { success: true };
  } catch (err: any) {
    console.error("Error en updateVisualsImage:", err);
    return { success: false, error: err.message || "Error al actualizar imagen" };
  }
}

/**
 * Toggle estado activo/inactivo
 */
export async function toggleVisualsImageActive(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    // Obtener estado actual
    const { data: img, error: getError } = await supabase
      .from("visuals_imagen")
      .select("activo, titulo")
      .eq("id", id)
      .single();

    if (getError || !img) throw getError || new Error("Imagen no encontrada");

    const nuevoEstado = !img.activo;

    const { error } = await supabase
      .from("visuals_imagen")
      .update({ 
        activo: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;

    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "UPDATE",
        table_name: "visuals_imagen",
        record_id: id,
        details: { action: nuevoEstado ? "Activar imagen Visuals" : "Desactivar imagen Visuals", titulo: img.titulo }
      });
    } catch (auditError) {
      console.error("Error en audit_log:", auditError);
    }

    revalidatePath("/visuals");
    revalidatePath("/admin/visuals");
    return { success: true };
  } catch (err: any) {
    console.error("Error en toggleVisualsImageActive:", err);
    return { success: false, error: err.message || "Error al cambiar estado" };
  }
}

/**
 * Borrado lógico (deleted_at) de una imagen de Visuals
 */
export async function deleteVisualsImage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const { error } = await supabase
      .from("visuals_imagen")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "DELETE",
        table_name: "visuals_imagen",
        record_id: id,
        details: { action: "Eliminar (borrado lógico) imagen Visuals" }
      });
    } catch (auditError) {
      console.error("Error en audit_log:", auditError);
    }

    revalidatePath("/visuals");
    revalidatePath("/admin/visuals");
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteVisualsImage:", err);
    return { success: false, error: err.message || "Error al eliminar imagen" };
  }
}
