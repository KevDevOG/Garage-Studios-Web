import { createPublicClient } from "@/lib/supabase/public";

export interface GalleryImage {
  id: string;
  titulo: string;
  descripcion: string | null;
  url_imagen: string;
}

/**
 * Imágenes de la galería pública (tabla `imagen`), de más reciente a más
 * antigua. Lectura sin cookies para permitir páginas estáticas con ISR.
 * `limit` acota la consulta (p. ej. 4 para la previsualización de la home).
 */
export async function getPublicGalleryImages(limit?: number): Promise<GalleryImage[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  let query = supabase
    .from("imagen")
    .select("id, titulo, descripcion, url_imagen")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener la galería:", error);
    return [];
  }
  return (data as GalleryImage[]) || [];
}
