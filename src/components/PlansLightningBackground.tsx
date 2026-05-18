"use client";

import { useEffect, useState } from "react";

/**
 * PlansLightningBackground — Fondo ambiental de rayos sutiles para la sección de Planes.
 *
 * Renderiza un único vídeo rayos.webm centrado, solo visible en desktop grande (xl+).
 * Respeta la preferencia de movimiento reducido del usuario.
 */
export default function PlansLightningBackground() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden xl:block"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-screen"
      >
        <source src="/videos/rayos.webm" type="video/webm" />
      </video>

      {/* Overlay de oscurecimiento sutil */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Máscara radial para mantener legibilidad en el centro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_45%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}
