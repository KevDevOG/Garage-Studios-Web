"use server";

import { createClient } from "@/lib/supabase/server";

export interface DBService {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number | string;
  duracion_minutos: number;
  categoria: string;
  subcategoria: string | null;
  icono: string;
  es_pack: boolean;
}

// Orden canónico de categorías para la web pública
const CATEGORY_ORDER: Record<string, number> = {
  "Grabación":  1,
  "Beats":      2,
  "Fotografía": 3,
  "Videoclips": 4,
};

export async function getActiveServices(): Promise<DBService[]> {
  const supabase = await createClient();

  // Obtener solo los servicios activos desde la base de datos
  const { data, error } = await supabase
    .from("servicio")
    .select("id, nombre, descripcion, precio, duracion_minutos, categoria, subcategoria, icono, es_pack")
    .eq("activo", true)
    .order("categoria", { ascending: true })
    .order("precio",    { ascending: true });

  if (error) {
    console.error("Error al obtener servicios:", error);
    return [];
  }

  // Re-ordenar en memoria según el orden canónico de categorías
  const sorted = (data || []).sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.categoria] ?? 99;
    const orderB = CATEGORY_ORDER[b.categoria] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return Number(a.precio) - Number(b.precio);
  });

  return sorted;
}
