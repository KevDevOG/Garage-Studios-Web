"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PlansLightningBackground — Fondo ambiental de rayos sutiles para la sección de Planes.
 *
 * El vídeo rayos.webm pesa ~9 MB, así que solo se monta cuando:
 * - la pantalla es grande (≥ 1280 px),
 * - el usuario no ha pedido movimiento reducido,
 * - y la sección está a punto de entrar en el viewport (IntersectionObserver).
 * Antes, el vídeo se descargaba también en móvil aunque estuviera oculto con CSS.
 */
export default function PlansLightningBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const largeScreen = window.matchMedia("(min-width: 1280px)");
    const node = containerRef.current;
    if (!node) return;

    let observer: IntersectionObserver | null = null;

    const evaluate = () => {
      if (reduceMotion.matches || !largeScreen.matches) {
        observer?.disconnect();
        observer = null;
        return;
      }
      if (observer || shouldLoad) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShouldLoad(true);
            observer?.disconnect();
            observer = null;
          }
        },
        { rootMargin: "400px 0px" }
      );
      observer.observe(node);
    };

    evaluate();
    largeScreen.addEventListener("change", evaluate);
    reduceMotion.addEventListener("change", evaluate);

    return () => {
      observer?.disconnect();
      largeScreen.removeEventListener("change", evaluate);
      reduceMotion.removeEventListener("change", evaluate);
    };
  }, [shouldLoad]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden xl:block"
    >
      {shouldLoad && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-screen"
        >
          <source src="/videos/rayos.webm" type="video/webm" />
        </video>
      )}

      {/* Overlay de oscurecimiento sutil */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Máscara radial para mantener legibilidad en el centro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_45%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}
