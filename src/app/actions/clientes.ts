"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuditLog } from "@/lib/audit";

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
  etiquetas: string[];
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

export interface ClientesMetrics {
  nuevos: number;
  recurrentes: number;
  reservas: number;
  ingresos: number;
  ticketMedio: number;
}

export interface TopClienteRanking {
  id: string;
  nombre: string;
  reservas: number;
  total_pagado: number;
  ultimo_servicio: string | null;
  es_recurrente: boolean;
}

export interface ClienteEvolution {
  month: string;
  nuevos: number;
  reservas: number;
  ingresos: number;
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
): Promise<string | null> {
  try {
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
      console.warn("No se pudo crear cliente desde reserva pública (RLS u otro):", error);
      return null;
    }

    return newCliente.id;
  } catch (err) {
    console.warn("Excepción al intentar crear cliente público:", err);
    return null;
  }
}

// ── updateClienteStats (público, sin auth) ──

export async function updateClienteStats(
  supabaseOrNull: SupabaseClient | null,
  clienteId: string | null
) {
  if (!clienteId) return;

  const supabase = supabaseOrNull || (await createClient());

  // Obtener todas las reservas activas del cliente
  const { data: reservas } = await supabase
    .from("reserva")
    .select("id, estado, created_at, fecha_reserva, servicio_id, precio, importe_pagado, estado_pago")
    .eq("cliente_id", clienteId)
    .is("deleted_at", null);

  if (!reservas) return;

  const total = reservas.length;
  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const canceladas = reservas.filter((r) => r.estado === "cancelada").length;
  const completadas = reservas.filter((r) => r.estado === "completada").length;

  // Importe: cobros reales
  const importe = reservas
    .filter((r) => 
      (r.estado_pago === "parcial" || r.estado_pago === "pagado") && 
      !["cancelada", "rechazada"].includes(r.estado) &&
      (Number(r.importe_pagado) || 0) > 0
    )
    .reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

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
  search?: string,
  tag?: string
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

  if (tag && tag.trim()) {
    query = query.contains("etiquetas", [tag.trim()]);
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

  await createAuditLog({
    accion: "edición",
    entidad: "cliente",
    entidad_id: id,
    descripcion: `Cliente ${nombre} editado (estado: ${estado})`,
    metadata: { estado, origen },
  });

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

// ── Métricas y Estadísticas (admin) ──

export async function getClientesMetrics(month: number | null, year: number): Promise<ClientesMetrics> {
  const supabase = await requireAuth();

  let startDate: string;
  let endDate: string;
  let startDateStr: string;
  let endDateStr: string;

  if (month !== null) {
    startDate = new Date(year, month - 1, 1).toISOString();
    endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    startDateStr = startDate.split('T')[0];
    endDateStr = endDate.split('T')[0];
  } else {
    startDate = new Date(year, 0, 1).toISOString();
    endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    startDateStr = `${year}-01-01`;
    endDateStr = `${year}-12-31`;
  }

  // 1. Clientes nuevos del periodo
  const { count: nuevos } = await supabase
    .from("cliente")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // 2. Total reservas del periodo (no eliminadas, estados confirmada/completada para ingresos)
  const { data: reservas } = await supabase
    .from("reserva")
    .select("cliente_id, importe_pagado, estado, estado_pago")
    .is("deleted_at", null)
    .gte("fecha_reserva", startDateStr)
    .lte("fecha_reserva", endDateStr)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", '("cancelada","rechazada")');

  const totalReservas = reservas?.length || 0;
  
  // 3. Ingresos asociados (cobros reales)
  const ingresos = reservas?.reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0) || 0;

  // 4. Clientes con ingresos (para ticket medio)
  const clienteIdsWithRevenue = new Set(reservas?.filter(r => r.cliente_id).map(r => r.cliente_id));
  const ticketMedio = clienteIdsWithRevenue.size > 0 ? ingresos / clienteIdsWithRevenue.size : 0;

  // 5. Clientes recurrentes (con más de 1 reserva TOTAL hasta la fecha)
  const activeClienteIds = Array.from(clienteIdsWithRevenue);
  let recurrentes = 0;
  if (activeClienteIds.length > 0) {
    const { count } = await supabase
      .from("cliente")
      .select("*", { count: "exact", head: true })
      .in("id", activeClienteIds)
      .gt("total_reservas", 1);
    recurrentes = count || 0;
  }

  return {
    nuevos: nuevos || 0,
    recurrentes,
    reservas: totalReservas,
    ingresos,
    ticketMedio
  };
}

export async function getTopClientesByRevenue(month: number | null, year: number): Promise<TopClienteRanking[]> {
  const supabase = await requireAuth();
  
  let startDate: string;
  let endDate: string;

  if (month !== null) {
    startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    endDate = new Date(year, month, 0).toISOString().split('T')[0];
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  const { data: reservas } = await supabase
    .from("reserva")
    .select(`
      cliente_id,
      importe_pagado, 
      estado,
      estado_pago,
      servicio:servicio_id(nombre),
      cliente:cliente_id(nombre, total_reservas)
    `)
    .is("deleted_at", null)
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", '("cancelada","rechazada")')
    .not("cliente_id", "is", null);

  if (!reservas) return [];

  const map: Record<string, TopClienteRanking> = {};

  reservas.forEach((r: any) => {
    const cid = r.cliente_id;
    if (!map[cid]) {
      map[cid] = {
        id: cid,
        nombre: r.cliente?.nombre || "Desconocido",
        reservas: 0,
        total_pagado: 0,
        ultimo_servicio: r.servicio?.nombre || null,
        es_recurrente: (r.cliente?.total_reservas || 0) > 1
      };
    }
    map[cid].reservas += 1;
    map[cid].total_pagado += Number(r.importe_pagado) || 0;
  });

  return Object.values(map).sort((a, b) => b.total_pagado - a.total_pagado).slice(0, 5);
}

export async function getTopClientesByReservations(month: number | null, year: number): Promise<TopClienteRanking[]> {
  const supabase = await requireAuth();
  
  let startDate: string;
  let endDate: string;

  if (month !== null) {
    startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    endDate = new Date(year, month, 0).toISOString().split('T')[0];
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  const { data: reservas } = await supabase
    .from("reserva")
    .select(`
      cliente_id,
      importe_pagado, 
      estado,
      estado_pago,
      servicio:servicio_id(nombre),
      cliente:cliente_id(nombre, total_reservas)
    `)
    .is("deleted_at", null)
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", '("cancelada","rechazada")')
    .not("cliente_id", "is", null);

  if (!reservas) return [];

  const map: Record<string, TopClienteRanking> = {};

  reservas.forEach((r: any) => {
    const cid = r.cliente_id;
    if (!map[cid]) {
      map[cid] = {
        id: cid,
        nombre: r.cliente?.nombre || "Desconocido",
        reservas: 0,
        total_pagado: 0,
        ultimo_servicio: r.servicio?.nombre || null,
        es_recurrente: (r.cliente?.total_reservas || 0) > 1
      };
    }
    map[cid].reservas += 1;
    map[cid].total_pagado += Number(r.importe_pagado) || 0;
  });

  return Object.values(map).sort((a, b) => b.reservas - a.reservas).slice(0, 5);
}

export async function getClientesYearEvolution(year: number): Promise<ClienteEvolution[]> {
  const supabase = await requireAuth();

  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

  // 1. Obtener todos los clientes nuevos del año
  const { data: nuevos } = await supabase
    .from("cliente")
    .select("created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  // 2. Obtener todas las reservas del año
  const { data: reservas } = await supabase
    .from("reserva")
    .select("fecha_reserva, importe_pagado, estado, estado_pago")
    .is("deleted_at", null)
    .gte("fecha_reserva", `${year}-01-01`)
    .lte("fecha_reserva", `${year}-12-31`)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", '("cancelada","rechazada")');

  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const evolution: ClienteEvolution[] = months.map((m, idx) => {
    const monthNuevos = nuevos?.filter(n => new Date(n.created_at).getMonth() === idx).length || 0;
    
    const monthReservas = reservas?.filter(r => {
      const d = new Date(r.fecha_reserva);
      return d.getMonth() === idx;
    }) || [];

    const ingresos = monthReservas.reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

    return {
      month: m,
      nuevos: monthNuevos,
      reservas: monthReservas.length,
      ingresos
    };
  });

  return evolution;
}

export async function getClienteStats(clienteId: string) {
  const supabase = await requireAuth();

  const { data: reservas } = await supabase
    .from("reserva")
    .select("estado, precio, importe_pagado, estado_pago, servicio:servicio_id(nombre), fecha_reserva")
    .eq("cliente_id", clienteId)
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: false });

  if (!reservas) return null;

  const total = reservas.length;
  const completadas = reservas.filter(r => r.estado === "completada").length;
  const canceladas = reservas.filter(r => r.estado === "cancelada").length;
  const confirmadas = reservas.filter(r => r.estado === "confirmada").length;
  
  const pagado = reservas
    .filter(r => (r.estado_pago === "parcial" || r.estado_pago === "pagado") && !["cancelada", "rechazada"].includes(r.estado))
    .reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

  const numReservasConPago = reservas.filter(r => (Number(r.importe_pagado) || 0) > 0).length;
  const ticketMedio = numReservasConPago > 0 ? pagado / numReservasConPago : 0;
  
  // Servicio más contratado
  const freq: Record<string, number> = {};
  reservas.forEach(r => {
    const name = (r.servicio as any)?.nombre || "Otros";
    freq[name] = (freq[name] || 0) + 1;
  });
  const topServicio = Object.entries(freq).sort((a,b) => b[1] - a[1])[0]?.[0] || "—";

  // Evolución mensual (últimos 6 meses)
  const last6Months: { month: string; reservas: number; ingresos: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleString('es-ES', { month: 'short' });
    
    const monthReservas = reservas.filter(r => {
      const rd = new Date(r.fecha_reserva);
      return rd.getMonth() + 1 === m && rd.getFullYear() === y;
    });

    const monthIngresos = monthReservas
      .filter(r => (r.estado_pago === "parcial" || r.estado_pago === "pagado") && !["cancelada", "rechazada"].includes(r.estado))
      .reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

    last6Months.push({
      month: label,
      reservas: monthReservas.length,
      ingresos: monthIngresos
    });
  }

  return {
    total,
    completadas,
    canceladas,
    confirmadas,
    pagado,
    ticketMedio,
    topServicio,
    ultimaReserva: reservas[0]?.fecha_reserva || null,
    evolucion: last6Months
  };
}

// ── CRM: Etiquetas ──

export async function updateClienteEtiquetas(clienteId: string, etiquetas: string[]) {
  const supabase = await requireAuth();

  const { error } = await supabase
    .from("cliente")
    .update({ 
      etiquetas,
      updated_at: new Date().toISOString()
    })
    .eq("id", clienteId);

  if (error) throw new Error("Error al actualizar etiquetas");

  revalidateClientes(clienteId);

  await createAuditLog({
    accion: "edición",
    entidad: "cliente",
    entidad_id: clienteId,
    descripcion: `Etiquetas actualizadas: ${etiquetas.join(", ")}`,
    metadata: { etiquetas }
  });

  return { success: true };
}

// ── CRM: Notas Internas ──

export interface ClienteNota {
  id: string;
  cliente_id: string;
  nota: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getClienteNotas(clienteId: string): Promise<ClienteNota[]> {
  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("cliente_nota")
    .select("*")
    .eq("cliente_id", clienteId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function addClienteNota(clienteId: string, nota: string) {
  const supabase = await requireAuth();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("cliente_nota")
    .insert([{ 
      cliente_id: clienteId, 
      nota,
      creado_por: user?.id 
    }])
    .select()
    .single();

  if (error) throw new Error("No se pudo añadir la nota");

  revalidatePath(`/admin/clientes/${clienteId}`);

  await createAuditLog({
    accion: "creación",
    entidad: "cliente_nota",
    entidad_id: data.id,
    descripcion: `Nueva nota añadida al cliente ${clienteId}`,
    metadata: { nota }
  });

  return data;
}

export async function updateClienteNota(notaId: string, nota: string) {
  const supabase = await requireAuth();
  const { data, error } = await supabase
    .from("cliente_nota")
    .update({ 
      nota, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", notaId)
    .select()
    .single();

  if (error) throw new Error("No se pudo actualizar la nota");

  revalidatePath(`/admin/clientes/${data.cliente_id}`);

  await createAuditLog({
    accion: "edición",
    entidad: "cliente_nota",
    entidad_id: notaId,
    descripcion: "Nota de cliente actualizada",
    metadata: { nota }
  });

  return data;
}

export async function deleteClienteNota(notaId: string) {
  const supabase = await requireAuth();
  
  // Primero obtenemos el cliente_id para revalidar antes de que "desaparezca" de la vista si fuera el caso
  const { data: nota, error: fetchError } = await supabase
    .from("cliente_nota")
    .select("cliente_id")
    .eq("id", notaId)
    .single();

  if (fetchError) {
    console.error("Error al buscar la nota para borrar:", {
      code: fetchError?.code,
      message: fetchError?.message,
      details: fetchError?.details,
      hint: fetchError?.hint
    });
    throw new Error("No se pudo encontrar la nota");
  }

  const { error: updateError } = await supabase
    .from("cliente_nota")
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", notaId);

  if (updateError) {
    console.error("Error eliminando nota (borrado lógico):", {
      code: updateError?.code,
      message: updateError?.message,
      details: updateError?.details,
      hint: updateError?.hint
    });
    throw new Error("No se pudo eliminar la nota");
  }

  // Revalidar listado y detalle
  revalidatePath("/admin/clientes");
  if (nota?.cliente_id) {
    revalidatePath(`/admin/clientes/${nota.cliente_id}`);
  }

  await createAuditLog({
    accion: "eliminación",
    entidad: "cliente_nota",
    entidad_id: notaId,
    descripcion: "Nota de cliente eliminada (borrado lógico)"
  });

  return { success: true };
}

// ── CRM: Estadísticas Comerciales ──

export interface CommercialStats {
  totalPagado: number;
  importePendiente: number;
  ticketMedioReal: number;
  totalReservas: number;
  completadas: number;
  canceladas: number;
  pendientes: number;
  proximaReserva: string | null;
  ultimaReserva: string | null;
  servicioFavorito: string;
}

export async function getClienteCommercialStats(clienteId: string): Promise<CommercialStats> {
  const supabase = await requireAuth();

  const { data: reservas } = await supabase
    .from("reserva")
    .select("id, estado, precio, importe_pagado, estado_pago, fecha_reserva, servicio:servicio_id(nombre)")
    .eq("cliente_id", clienteId)
    .is("deleted_at", null);

  if (!reservas) {
    return {
      totalPagado: 0,
      importePendiente: 0,
      ticketMedioReal: 0,
      totalReservas: 0,
      completadas: 0,
      canceladas: 0,
      pendientes: 0,
      proximaReserva: null,
      ultimaReserva: null,
      servicioFavorito: "—"
    };
  }

  const activeReservations = reservas.filter(r => !["cancelada", "rechazada"].includes(r.estado));
  
  const totalPagado = activeReservations
    .reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

  const importePendiente = activeReservations
    .reduce((sum, r) => {
      const precio = Number(r.precio) || 0;
      const pagado = Number(r.importe_pagado) || 0;
      return sum + Math.max(0, precio - pagado);
    }, 0);

  const numReservasConCobro = activeReservations.filter(r => (Number(r.importe_pagado) || 0) > 0).length;
  const ticketMedioReal = numReservasConCobro > 0 ? totalPagado / numReservasConCobro : 0;

  const completadas = reservas.filter(r => r.estado === "completada").length;
  const canceladas = reservas.filter(r => r.estado === "cancelada").length;
  const pendientes = reservas.filter(r => r.estado === "confirmada" || r.estado === "pendiente").length;

  // Próxima vs Última (basado en fecha_reserva)
  const now = new Date().toISOString().split('T')[0];
  const sorted = [...reservas].sort((a, b) => a.fecha_reserva.localeCompare(b.fecha_reserva));
  
  const proxima = sorted.find(r => r.fecha_reserva >= now && r.estado !== "cancelada" && r.estado !== "rechazada")?.fecha_reserva || null;
  const ultima = [...sorted].reverse().find(r => r.fecha_reserva < now)?.fecha_reserva || null;

  // Servicio favorito
  const freq: Record<string, number> = {};
  reservas.forEach(r => {
    const sName = (r.servicio as any)?.nombre || "Otros";
    freq[sName] = (freq[sName] || 0) + 1;
  });
  const servicioFavorito = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  return {
    totalPagado,
    importePendiente,
    ticketMedioReal,
    totalReservas: reservas.length,
    completadas,
    canceladas,
    pendientes,
    proximaReserva: proxima,
    ultimaReserva: ultima,
    servicioFavorito
  };
}
