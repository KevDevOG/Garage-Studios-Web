import { cache } from "react";
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
 *
 * `cache` de React la resuelve UNA vez por petición: una página que carga
 * cinco lecturas en paralelo valida la sesión una sola vez (antes eran dos
 * viajes a Supabase por cada lectura). No guarda nada entre peticiones, así
 * que cada navegación y cada acción vuelven a comprobar sesión y lista. Si la
 * comprobación falla, el resultado sigue siendo "sin acceso" (fallo cerrado).
 */
export const getAdminSession = cache(
  async (): Promise<{ supabase: SupabaseClient; user: User | null }> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!(await isAuthorizedAdmin(supabase, user))) {
      return { supabase, user: null };
    }
    return { supabase, user };
  },
);
