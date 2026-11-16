// ── Clientes Supabase sin cookies (servidor) ──────────────────
// Para páginas públicas (inicio, servicios, galería, reservas) y para
// Server Actions anónimas. Al no leer cookies, las páginas que lo usan
// pueden prerenderizarse de forma estática y revalidarse (ISR), en lugar
// de renderizarse en cada petición como ocurre con `@/lib/supabase/server`.
//
// Las dos factorías devuelven `null` si faltan variables de entorno, para
// que un build sin credenciales no falle: quien las use debe tratar `null`
// como "sin datos".

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store" });
}

function buildClient(key: string | undefined): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}

/**
 * Cliente anónimo (rol `anon`, sujeto a RLS). Úsalo para lecturas públicas
 * y para las inserciones del formulario público.
 */
export function createPublicClient(): SupabaseClient | null {
  return buildClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Cliente con la clave de servicio (salta RLS). SOLO en servidor y SOLO para
 * lecturas acotadas que el rol anónimo no puede hacer (p. ej. buscar una
 * reserva por su token de calendario). Devuelve `null` si la clave no está
 * configurada; el código debe tener siempre un camino alternativo.
 */
export function createServiceClient(): SupabaseClient | null {
  return buildClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
