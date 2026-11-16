"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Script from "next/script";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export interface TurnstileController {
  /** Clave pública; si no está definida el captcha está desactivado (desarrollo). */
  siteKey: string | undefined;
  /** Token actual o null si no se ha resuelto / ha caducado. */
  token: string | null;
  /** Reinicia el widget para pedir un nuevo token tras un error de envío. */
  reset: () => void;
  /** Elemento a renderizar en el formulario (script + contenedor). Null si está desactivado. */
  widget: ReactNode;
}

/**
 * Hook compartido por los formularios públicos para gestionar Cloudflare
 * Turnstile sin duplicar lógica. Devuelve el propio widget como nodo React
 * para que el formulario solo tenga que insertarlo donde quiera.
 */
export function useTurnstile(theme: "light" | "dark" = "dark"): TurnstileController {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const render = useCallback(() => {
    const api = typeof window !== "undefined" ? window.turnstile : undefined;
    if (!siteKey || !api || !containerRef.current) return;

    if (widgetIdRef.current) {
      try {
        api.remove(widgetIdRef.current);
      } catch {
        /* el widget ya no existe */
      }
      widgetIdRef.current = null;
    }
    containerRef.current.innerHTML = "";

    const id = api.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(null),
      "error-callback": () => setToken(null),
    });
    widgetIdRef.current = id ?? null;
  }, [siteKey, theme]);

  useEffect(() => {
    // Si el script ya estaba cargado (navegación cliente), pintamos directamente.
    if (siteKey && window.turnstile) render();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
        widgetIdRef.current = null;
      }
    };
  }, [render, siteKey]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        return;
      } catch {
        /* caemos al re-render */
      }
    }
    render();
  }, [render]);

  const widget = siteKey ? (
    <>
      <Script src={TURNSTILE_SRC} strategy="lazyOnload" onLoad={render} />
      <div ref={containerRef} className="flex min-h-[65px] justify-center" />
    </>
  ) : null;

  return { siteKey, token, reset, widget };
}
