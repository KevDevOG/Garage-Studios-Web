"use server";

import { getAdminSession } from "@/lib/auth";
import { buildIlikePattern, buildOrIlike } from "@/lib/search";
import { getZonedParts, monthRange, todayInStudio } from "@/lib/dates";

export interface AuditLogFilters {
  query?: string;
  entidad?: string;
  accion?: string;
  fecha?: "hoy" | "7dias" | "este_mes" | "todo";
  order?: "asc" | "desc";
}

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILTER_LENGTH = 60;

/**
 * Instante (ISO UTC) en el que empieza un día (YYYY-MM-DD) en la zona del
 * estudio, teniendo en cuenta el horario de verano.
 */
function startOfStudioDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  const local = getZonedParts(new Date(utcMidnight));
  // Canarias va por delante o igual que UTC: si a las 00:00 UTC son las 01:00
  // locales, el día local empezó una hora antes.
  const offsetMinutes = local.day === d ? local.hour * 60 + local.minute : 0;
  return new Date(utcMidnight - offsetMinutes * 60_000).toISOString();
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRow[]> {
  const { supabase, user } = await getAdminSession();
  if (!user) throw new Error("No autorizado");

  let query = supabase.from("audit_log").select("*");

  // Filtros
  const entidad = typeof filters.entidad === "string" ? filters.entidad.slice(0, MAX_FILTER_LENGTH) : "";
  if (entidad && entidad !== "todos") {
    query = query.eq("entidad", entidad);
  }

  const accion = typeof filters.accion === "string" ? filters.accion.slice(0, MAX_FILTER_LENGTH) : "";
  if (accion && accion !== "todos") {
    query = query.eq("accion", accion);
  }

  // entidad_id es UUID: ilike fallaría en Postgres. Solo se compara por
  // igualdad cuando el término es un UUID completo.
  const rawTerm = typeof filters.query === "string" ? filters.query.trim() : "";
  if (rawTerm) {
    const pattern = buildIlikePattern(rawTerm);
    const conditions: string[] = [];
    if (pattern) conditions.push(buildOrIlike(["descripcion", "entidad", "accion"], pattern));
    if (UUID_RE.test(rawTerm)) conditions.push(`entidad_id.eq.${rawTerm}`);
    if (conditions.length > 0) query = query.or(conditions.join(","));
  }

  if (filters.fecha === "hoy" || filters.fecha === "7dias" || filters.fecha === "este_mes") {
    const today = todayInStudio();
    let startDay = today;
    if (filters.fecha === "7dias") {
      startDay = addDays(today, -7);
    } else if (filters.fecha === "este_mes") {
      const { year, month } = getZonedParts();
      startDay = monthRange(year, month).start;
    }
    query = query.gte("created_at", startOfStudioDay(startDay));
  }

  const { data, error } = await query
    .order("created_at", { ascending: filters.order === "asc" })
    .limit(200);

  if (error) {
    console.error("Error fetching audit logs:", error.message);
    return [];
  }

  return (data ?? []) as AuditLogRow[];
}
