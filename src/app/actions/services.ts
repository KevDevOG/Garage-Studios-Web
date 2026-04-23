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

export async function getActiveServices(): Promise<DBService[]> {
  const supabase = await createClient();

  // Obtener solo los servicios activos desde la base de datos
  const { data, error } = await supabase
    .from("servicio")
    .select("id, nombre, descripcion, precio, duracion_minutos, categoria, subcategoria, icono, es_pack")
    .eq("activo", true)
    .order("precio", { ascending: true });

  if (error) {
    console.error("Error al obtener servicios:", error);
    return [];
  }

  return data || [];
}
