import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-allowlist";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export { isAuthorizedAdmin };

export class UnauthorizedError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "UnauthorizedError";
  }
}

/**
 * Devuelve el cliente Supabase con la sesión del administrador o lanza
 * `UnauthorizedError`. Única puerta de autorización para las Server Actions
 * del panel: exige sesión válida Y pertenencia a la lista privada.
 */
export async function requireAdmin(): Promise<{ supabase: SupabaseClient; user: User }> {
  const { supabase, user } = await getAdminSession();
  if (!user) throw new UnauthorizedError();
  return { supabase, user };
}

/**
 * Variante que no lanza: `user` es null si no hay sesión o si la cuenta no
 * está en la lista privada de administradores.
 */
export async function getAdminSession(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAuthorizedAdmin(supabase, user))) {
    return { supabase, user: null };
  }
  return { supabase, user };
}
