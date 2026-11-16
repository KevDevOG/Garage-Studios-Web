// ── Acceso a datos de clientes compartido por varias Server Actions ──
// Vive fuera de los archivos "use server" para no exponerse como endpoint
// invocable desde el navegador: aquí son funciones internas normales.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Crea un cliente desde el flujo público (o manual del panel).
 * Con el rol anónimo no es posible buscar clientes existentes (RLS); si el
 * email o teléfono ya existen, el índice único rechaza el INSERT y se
 * devuelve null: la reserva se guarda sin vincular y el panel ofrece
 * "Vincular reservas antiguas".
 */
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
      if (error?.code !== "23505") {
        console.warn("No se pudo crear cliente (RLS u otro):", error?.message);
      }
      return null;
    }

    return newCliente.id;
  } catch (err) {
    console.warn("Excepción al intentar crear cliente:", err);
    return null;
  }
}

/**
 * Recalcula las estadísticas agregadas de un cliente a partir de sus reservas.
 * Requiere un cliente autenticado (RLS): con anon no hace nada.
 */
export async function updateClienteStats(
  supabaseOrNull: SupabaseClient | null,
  clienteId: string | null
) {
  if (!clienteId) return;

  const supabase = supabaseOrNull || (await createClient());

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
    .filter(
      (r) =>
        (r.estado_pago === "parcial" || r.estado_pago === "pagado") &&
        !["cancelada", "rechazada"].includes(r.estado) &&
        (Number(r.importe_pagado) || 0) > 0
    )
    .reduce((sum, r) => sum + (Number(r.importe_pagado) || 0), 0);

  // Última reserva (por fecha_reserva)
  const sorted = [...reservas].sort((a, b) => b.fecha_reserva.localeCompare(a.fecha_reserva));
  const ultima = sorted[0] || null;

  // Servicio favorito (el más frecuente)
  let servicioFavoritoId: string | null = null;
  const freq: Record<string, number> = {};
  for (const r of reservas) {
    if (r.servicio_id) freq[r.servicio_id] = (freq[r.servicio_id] || 0) + 1;
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0) servicioFavoritoId = entries[0][0];

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
