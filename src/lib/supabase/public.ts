// ── Clientes Supabase sin cookies (servidor) ──────────────────
// Para páginas públicas (inicio, servicios, galería, reservas) y para
// Server Actions anónimas. Al no leer cookies, las páginas que lo usan
// pueden prerenderizarse de forma estática y revalidarse (ISR), en lugar
// de renderizarse en cada petición como ocurre con `@/lib/supabase/server`.
//
// Las dos factorías devuelven `null` si faltan variables de entorno, para
// que un build sin credenciales no falle: quien las use debe tratar `null`
// como "sin datos".
//
// `fresh: true` fuerza `cache: "no-store"` en las peticiones. SOLO para
// Server Actions y Route Handlers (disponibilidad, inserciones, .ics): en una
// página con `revalidate` ese flag la convertiría en dinámica y la rompería
// durante el prerender ("Dynamic server usage").

// Este módulo lee SUPABASE_SERVICE_ROLE_KEY: importarlo desde un componente
// cliente debe romper el build, no filtrar la clave (Next.js resuelve
// `server-only` internamente; no requiere dependencia).
import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

interface PublicClientOptions {
  /** Desactiva cualquier caché de fetch. Nunca en páginas estáticas. */
  fresh?: boolean;
}

function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store" });
}

function buildClient(key: string | undefined, options: PublicClientOptions): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: options.fresh ? { fetch: noStoreFetch } : undefined,
  });
}

/**
 * Cliente anónimo (rol `anon`, sujeto a RLS). Úsalo para lecturas públicas
 * y, con `fresh: true`, para las acciones del formulario público.
 */
export function createPublicClient(options: PublicClientOptions = {}): SupabaseClient | null {
  return buildClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options);
}

/**
 * Cliente con la clave de servicio (salta RLS). SOLO en servidor y SOLO para
 * lecturas acotadas que el rol anónimo no puede hacer (p. ej. buscar una
 * reserva por su token de calendario). Devuelve `null` si la clave no está
 * configurada; el código debe tener siempre un camino alternativo.
 */
export function createServiceClient(options: PublicClientOptions = { fresh: true }): SupabaseClient | null {
  return buildClient(process.env.SUPABASE_SERVICE_ROLE_KEY, options);
}
