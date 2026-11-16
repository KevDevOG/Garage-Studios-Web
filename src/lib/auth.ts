import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "UnauthorizedError";
  }
}

/**
 * Devuelve el cliente Supabase con la sesión del administrador o lanza
 * `UnauthorizedError`. Única puerta de autorización para las Server Actions
 * del panel: evita repetir `getUser()` en cada archivo.
 *
 * Nota: hoy cualquier usuario autenticado de Supabase Auth es admin (las
 * políticas RLS son `TO authenticated`). Mantener el registro de usuarios
 * cerrado en el proyecto de Supabase es imprescindible.
 */
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; user: User }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  return { supabase, user };
}

/**
 * Variante que no lanza: útil en lecturas de páginas donde el proxy ya ha
 * redirigido a /admin/login y solo se quiere el cliente.
 */
export async function getAdminSession(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
