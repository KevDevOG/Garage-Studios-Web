"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResults {
  clientes: any[];
  reservas: any[];
  finanzas: any[];
  mensajes: any[];
  servicios: any[];
}

export async function searchGlobalAdmin(query: string): Promise<SearchResults> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const results: SearchResults = {
    clientes: [],
    reservas: [],
    finanzas: [],
    mensajes: [],
    servicios: [],
  };

  if (!query || query.length < 2) return results;

  const searchTerm = `%${query}%`;

  // 1. Clientes
  const { data: clientes } = await supabase
    .from("cliente")
    .select("id, nombre, email, telefono")
    .or(`nombre.ilike.${searchTerm},email.ilike.${searchTerm},telefono.ilike.${searchTerm}`)
    .limit(5);
  results.clientes = clientes || [];

  // 2. Reservas
  const { data: reservas } = await supabase
    .from("reserva")
    .select("id, nombre, fecha_reserva, hora_inicio, estado, servicio(nombre)")
    .or(`nombre.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: false })
    .limit(5);
  results.reservas = reservas || [];

  // 3. Finanzas
  const { data: finanzas } = await supabase
    .from("finanza_movimiento")
    .select("id, concepto, importe, fecha")
    .ilike("concepto", searchTerm)
    .order("fecha", { ascending: false })
    .limit(5);
  results.finanzas = finanzas || [];

  // 4. Mensajes
  const { data: mensajes } = await supabase
    .from("contacto")
    .select("id, nombre, email, asunto, created_at")
    .or(`nombre.ilike.${searchTerm},email.ilike.${searchTerm},asunto.ilike.${searchTerm}`)
    .order("created_at", { ascending: false })
    .limit(5);
  results.mensajes = mensajes || [];

  // 5. Servicios
  const { data: servicios } = await supabase
    .from("servicio")
    .select("id, nombre, precio, activo")
    .ilike("nombre", searchTerm)
    .limit(5);
  results.servicios = servicios || [];

  return results;
}
