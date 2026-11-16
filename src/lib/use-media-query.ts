"use client";

import { useSyncExternalStore } from "react";

/**
 * Suscripción a una media query sin setState dentro de useEffect.
 * En servidor devuelve `fallback` (por defecto false) y en cliente el valor real.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
