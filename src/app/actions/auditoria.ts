"use server";

import { createClient } from "@/lib/supabase/server";

export interface AuditLogFilters {
  query?: string;
  entidad?: string;
  accion?: string;
  fecha?: "hoy" | "7dias" | "este_mes" | "todo";
  order?: "asc" | "desc";
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  let query = supabase
    .from("audit_log")
    .select("*");

  // Filtros
  if (filters.entidad && filters.entidad !== "todos") {
    query = query.eq("entidad", filters.entidad);
  }

  if (filters.accion && filters.accion !== "todos") {
    query = query.eq("accion", filters.accion);
  }

  if (filters.query) {
    query = query.or(`descripcion.ilike.%${filters.query}%,entidad_id.ilike.%${filters.query}%`);
  }

  if (filters.fecha && filters.fecha !== "todo") {
    const now = new Date();
    let startDate = new Date();

    if (filters.fecha === "hoy") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filters.fecha === "7dias") {
      startDate.setDate(now.getDate() - 7);
    } else if (filters.fecha === "este_mes") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  const { data, error } = await query
    .order("created_at", { ascending: filters.order === "asc" })
    .limit(200);

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return data;
}
