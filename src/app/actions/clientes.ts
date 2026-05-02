"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Helpers ──

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

function revalidateClientes(id?: string) {
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/calendario");
  if (id) {
    revalidatePath(`/admin/clientes/${id}`);
  }
}

// ── Tipos ──

export interface ClienteRow {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  instagram: string | null;
  notas: string | null;
  origen: string;
  estado: string;
  total_reservas: number;
  reservas_confirmadas: number;
  reservas_canceladas: number;
  reservas_completadas: number;
  ultima_reserva_at: string | null;
  ultima_reserva_fecha: string | null;
  servicio_favorito_id: string | null;
  importe_total: number;
  created_at: string;
  updated_at: string;
  servicio_favorito?: { nombre: string } | null;
}

// ── findOrCreateCliente (público, sin auth) ──

export async function findOrCreateClientePublic(
  supabase: SupabaseClient,
  data: {
    nombre: string;
    email?: string;
    telefono?: string;
    instagram?: string;
    origen?: string;
  }
): Promise<string> {
  // 1. Buscar por email
  if (data.email) {
    const { data: byEmail } = await supabase
      .from("cliente")
      .select("id")
      .eq("email", data.email)
      .single();

    if (byEmail) {
      // Actualizar datos del cliente existente
      await supabase
        .from("cliente")
        .update({
          nombre: data.nombre,
          telefono: data.telefono || undefined,
          instagram: data.instagram || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", byEmail.id);
      return byEmail.id;
    }
  }

  // 2. Buscar por teléfono
  if (data.telefono) {
    const { data: byPhone } = await supabase
      .from("cliente")
      .select("id")
      .eq("telefono", data.telefono)
      .single();

    if (byPhone) {
      await supabase
        .from("cliente")
        .update({
          nombre: data.nombre,
          email: data.email || undefined,
          instagram: data.instagram || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", byPhone.id);
      return byPhone.id;
    }
  }

  // 3. Crear nuevo
  const { data: newCliente, error } = await supabase
    .from("cliente")
    .insert([
      {
        nombre: data.nombre,
        email: data.email || null,
        telefono: data.telefono || null,
        instagram: data.instagram || null,
        origen: data.origen || "web",
      },
    ])
    .select("id")
    .single();

  if (error || !newCliente) {
    console.error("Error al crear cliente:", error);
    throw new Error("Error al crear cliente");
  }

  return newCliente.id;
}

// ── updateClienteStats (público, sin auth) ──

export async function updateClienteStats(
  supabaseOrNull: SupabaseClient | null,
  clienteId: string
) {
  const supabase = supabaseOrNull || (await createClient());

  // Obtener todas las reservas activas del cliente
  const { data: reservas } = await supabase
    .from("reserva")
    .select("id, estado, created_at, fecha_reserva, servicio_id, precio")
    .eq("cliente_id", clienteId)
    .is("deleted_at", null);

  if (!reservas) return;

  const total = reservas.length;
  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const canceladas = reservas.filter((r) => r.estado === "cancelada").length;
  const completadas = reservas.filter((r) => r.estado === "completada").length;

  // Importe: solo confirmadas + completadas
  const importe = reservas
    .filter((r) => r.estado === "confirmada" || r.estado === "completada")
    .reduce((sum, r) => sum + (Number(r.precio) || 0), 0);

  // Última reserva (por created_at)
  const sorted = [...reservas].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const ultima = sorted[0] || null;

  // Servicio favorito (el más frecuente)
  let servicioFavoritoId: string | null = null;
  if (reservas.length > 0) {
    const freq: Record<string, number> = {};
    for (const r of reservas) {
      if (r.servicio_id) {
        freq[r.servicio_id] = (freq[r.servicio_id] || 0) + 1;
      }
    }
    const entries = Object.entries(freq);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      servicioFavoritoId = entries[0][0];
    }
  }

  await supabase
    .from("cliente")
    .update({
      total_reservas: total,
      reservas_confirmadas: confirmadas,
      reservas_canceladas: canceladas,
      reservas_completadas: completadas,
      importe_total: importe,
      ultima_reserva_at: ultima?.created_at || null,
      ultima_reserva_fecha: ultima?.fecha_reserva || null,
      servicio_favorito_id: servicioFavoritoId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clienteId);
}

// ── getClientes (admin) ──

export async function getClientes(
  search?: string
): Promise<ClienteRow[]> {
  const supabase = await requireAuth();

  let query = supabase
    .from("cliente")
    .select("*, servicio_favorito:servicio_favorito_id(nombre)")
    .order("ultima_reserva_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `nombre.ilike.${term},email.ilike.${term},telefono.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }

  return (data as ClienteRow[]) || [];
}

// ── getClienteById (admin) ──

export async function getClienteById(
  id: string
): Promise<ClienteRow | null> {
  const supabase = await requireAuth();

  const { data, error } = await supabase
    .from("cliente")
    .select("*, servicio_favorito:servicio_favorito_id(nombre)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ClienteRow;
}

// ── updateCliente (admin) ──

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await requireAuth();

  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const instagram = formData.get("instagram") as string;
  const notas = formData.get("notas") as string;
  const estado = formData.get("estado") as string;
  const origen = formData.get("origen") as string;

  const { error } = await supabase
    .from("cliente")
    .update({
      nombre,
      email: email || null,
      telefono: telefono || null,
      instagram: instagram || null,
      notas: notas || null,
      estado,
      origen,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar cliente:", error);
    return { error: "Error al guardar los cambios." };
  }

  revalidateClientes(id);
  return { success: true };
}

// ── searchClientes (admin, para autocompletado) ──

export async function searchClientes(
  term: string
): Promise<{ id: string; nombre: string; email: string | null; telefono: string | null }[]> {
  const supabase = await requireAuth();

  if (!term || term.trim().length < 2) return [];

  const search = `%${term.trim()}%`;
  const { data } = await supabase
    .from("cliente")
    .select("id, nombre, email, telefono")
    .or(`nombre.ilike.${search},email.ilike.${search},telefono.ilike.${search}`)
    .limit(10);

  return data || [];
}
