"use server";

import { createPublicClient } from "@/lib/supabase/public";

export interface DBService {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number | string;
  duracion_minutos: number;
  categoria: string;
  subcategoria: string | null;
  icono: string;
  icono_url: string | null;
  es_pack: boolean;
  orden: number;
}

/**
 * Servicios activos para la web pública.
 *
 * Usa el cliente sin cookies para que las páginas que lo llaman (inicio,
 * servicios, reservas, visuals) puedan prerenderizarse y revalidarse (ISR).
 * Las mutaciones del panel llaman a `revalidatePath` sobre esas rutas.
 */
export async function getActiveServices(): Promise<DBService[]> {
  const supabase = createPublicClient();
  if (!supabase) {
    console.warn("[Services] Supabase no configurado: catálogo vacío.");
    return [];
  }

  const { data, error } = await supabase
    .from("servicio")
    .select("id, nombre, descripcion, precio, duracion_minutos, categoria, subcategoria, icono, icono_url, es_pack, orden")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener servicios:", error);
    return [];
  }

  return data || [];
}
