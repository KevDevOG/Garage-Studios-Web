/**
 * Rate Limiter — Protección contra abuso en acciones públicas
 *
 * Implementación en memoria para desarrollo/producción inicial.
 * Para producción con múltiples instancias, sustituir por Upstash Redis:
 *
 *   npm install @upstash/ratelimit @upstash/redis
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(5, "1 h"),
 *   });
 */

import { headers } from "next/headers";

// Almacén en memoria: Map<identifier, { count, resetAt }>
const store = new Map<string, { count: number; resetAt: number }>();

// Limpieza periódica de entradas expiradas (cada 5 minutos)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Comprueba si una acción está dentro del límite de tasa.
 *
 * @param action - Identificador de la acción (ej: "contact", "reservation")
 * @param limit - Número máximo de peticiones en la ventana
 * @param windowMs - Duración de la ventana en milisegundos (default: 1 hora)
 * @returns { allowed, remaining, retryAfterMs }
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number = 60 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  cleanupStore();

  // Obtener IP del cliente
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  const key = `${action}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  // Si no hay entrada o la ventana ha expirado, crear nueva
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  // Incrementar contador
  entry.count++;

  if (entry.count > limit) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/**
 * Formatea el tiempo de espera para mostrar al usuario.
 */
export function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return "1 minuto";
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? "1 hora" : `${hours} horas`;
}
