"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export interface TurnstileController {
  /** Clave pública; si no está definida el captcha está desactivado (desarrollo). */
  siteKey: string | undefined;
  /** Token actual o null si no se ha resuelto / ha caducado. */
  token: string | null;
  /** Contenedor donde se pinta el widget. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Pinta (o repinta) el widget. Lo llama <TurnstileWidget> al cargar el script. */
  render: () => void;
  /** Reinicia el widget para pedir un nuevo token tras un error de envío. */
  reset: () => void;
}

/**
 * Hook compartido por los formularios públicos para gestionar Cloudflare
 * Turnstile sin duplicar lógica. Limpia el widget al desmontar.
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

  return { siteKey, token, containerRef, render, reset };
}

/**
 * Carga el script de Turnstile y reserva el hueco del widget.
 * No renderiza nada si el captcha está desactivado.
 */
export function TurnstileWidget({ controller }: { controller: TurnstileController }) {
  if (!controller.siteKey) return null;
  return (
    <>
      <Script src={TURNSTILE_SRC} strategy="lazyOnload" onLoad={controller.render} />
      <div ref={controller.containerRef} className="flex justify-center min-h-[65px]" />
    </>
  );
}
