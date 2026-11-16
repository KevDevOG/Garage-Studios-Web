import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Lista privada de administradores.
 *
 * Tener sesión en Supabase Auth NO basta: el usuario debe figurar en la tabla
 * `public.administrador` (clave = id de auth.users). Esa tabla solo se edita
 * desde el SQL Editor de Supabase o con la clave de servicio: ninguna política
 * RLS permite insertarse desde la web (migración 023).
 *
 * La comprobación real está en la base de datos (RLS con `private.is_admin()`);
 * esta función es la segunda capa, para que la app rechace pronto y con un
 * mensaje claro a cualquier cuenta que no esté en la lista.
 *
 * Consulta la tabla directamente (y no la RPC) para funcionar igual antes y
 * después de aplicar la migración 023: antes, la política permite leer la
 * tabla a cualquier autenticado y el filtro por id decide; después, solo un
 * administrador puede leerla.
 *
 * Sin dependencias de `next/headers`: se usa también desde el proxy.
 */
export async function isAuthorizedAdmin(supabase: SupabaseClient, user: User | null): Promise<boolean> {
  if (!user || user.is_anonymous) return false;

  const { data, error } = await supabase
    .from("administrador")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Fallo cerrado: sin poder comprobar la lista, no hay acceso.
    console.error("[Auth] No se pudo comprobar la lista de administradores:", error.code);
    return false;
  }
  return Boolean(data);
}
