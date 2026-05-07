/**
 * Audit Log — Registro de acciones importantes del panel admin
 *
 * Registra acciones como cambios de estado, ediciones, eliminaciones, etc.
 * Si falla el registro, NO rompe la acción principal.
 * No guarda datos sensibles completos, solo IDs y resúmenes.
 */

import { createClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  accion: string;       // "creación", "edición", "eliminación", "cambio_estado", etc.
  entidad: string;      // "reserva", "cliente", "finanza", "servicio", "imagen"
  entidad_id?: string;  // UUID de la entidad afectada
  descripcion?: string; // Resumen legible: "Reserva confirmada para Juan"
  metadata?: Record<string, unknown>; // Solo IDs, estados, resúmenes — NO datos sensibles
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Solo registrar si hay un admin autenticado
    if (!user) return;

    await supabase.from("audit_log").insert({
      admin_id: user.id,
      accion: entry.accion,
      entidad: entry.entidad,
      entidad_id: entry.entidad_id || null,
      descripcion: entry.descripcion || null,
      metadata: entry.metadata || null,
    });
  } catch (err) {
    // NUNCA romper la acción principal por un fallo en el audit log
    console.error("[AuditLog] Error al registrar acción:", err);
  }
}
