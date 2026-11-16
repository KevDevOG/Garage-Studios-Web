"use server";

import { requireAdmin } from "@/lib/auth";
import { buildIlikePattern, buildOrIlike } from "@/lib/search";

export interface SearchCliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}

export interface SearchReserva {
  id: string;
  nombre: string;
  fecha_reserva: string;
  hora_inicio: string | null;
  estado: string;
  servicio: { nombre: string } | null;
}

export interface SearchFinanza {
  id: string;
  concepto: string;
  importe: number;
  fecha: string;
  tipo: "ingreso" | "gasto";
}

export interface SearchMensaje {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  created_at: string;
  leido: boolean;
}

export interface SearchServicio {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface SearchResults {
  clientes: SearchCliente[];
  reservas: SearchReserva[];
  finanzas: SearchFinanza[];
  mensajes: SearchMensaje[];
  servicios: SearchServicio[];
}

const EMPTY: SearchResults = { clientes: [], reservas: [], finanzas: [], mensajes: [], servicios: [] };

/**
 * Buscador global del panel. El término se sanea antes de interpolarlo en los
 * filtros PostgREST y las cinco consultas se lanzan en paralelo.
 */
export async function searchGlobalAdmin(query: string): Promise<SearchResults> {
  const { supabase } = await requireAdmin();

  const pattern = buildIlikePattern(query);
  if (!pattern) return EMPTY;

  const [clientes, reservas, finanzas, mensajes, servicios] = await Promise.all([
    supabase
      .from("cliente")
      .select("id, nombre, email, telefono")
      .or(buildOrIlike(["nombre", "email", "telefono"], pattern))
      .limit(5),
    supabase
      .from("reserva")
      .select("id, nombre, fecha_reserva, hora_inicio, estado, servicio(nombre)")
      .or(buildOrIlike(["nombre", "email", "telefono"], pattern))
      .is("deleted_at", null)
      .order("fecha_reserva", { ascending: false })
      .limit(5),
    supabase
      .from("finanza_movimiento")
      .select("id, concepto, importe, fecha, tipo")
      .ilike("concepto", pattern)
      .is("deleted_at", null)
      .order("fecha", { ascending: false })
      .limit(5),
    supabase
      .from("contacto")
      .select("id, nombre, email, asunto, created_at, leido")
      .or(buildOrIlike(["nombre", "email", "asunto"], pattern))
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("servicio")
      .select("id, nombre, precio, activo")
      .ilike("nombre", pattern)
      .limit(5),
  ]);

  for (const result of [clientes, reservas, finanzas, mensajes, servicios]) {
    if (result.error) console.error("[AdminSearch]", result.error.message);
  }

  return {
    clientes: (clientes.data ?? []) as SearchCliente[],
    reservas: ((reservas.data ?? []) as unknown[]).map((row) => {
      const r = row as Omit<SearchReserva, "servicio"> & { servicio: SearchReserva["servicio"] | { nombre: string }[] };
      return { ...r, servicio: Array.isArray(r.servicio) ? r.servicio[0] ?? null : r.servicio };
    }),
    finanzas: (finanzas.data ?? []) as SearchFinanza[],
    mensajes: (mensajes.data ?? []) as SearchMensaje[],
    servicios: (servicios.data ?? []) as SearchServicio[],
  };
}
