interface CinematicBackgroundProps {
  variant: "gallery" | "services";
}

/**
 * CinematicSectionBackground — Fondo sutil inspirado en fotografía y cine para Garage Visuals.
 *
 * - Grano cinematográfico muy fino (patrón de ruido SVG).
 * - Focos de luz suaves tipo set de fotografía y glows cálidos.
 * - Totalmente estático y determinista: se renderiza en servidor sin estado
 *   ni efectos (antes se ocultaba hasta montar en cliente, lo que provocaba
 *   un parpadeo y un render extra).
 */
export default function CinematicSectionBackground({ variant }: CinematicBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
    >
      {/* 1. Grano cinematográfico ultrafino (SVG Noise) */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2. Focos de luz suaves tipo set de estudio */}
      {variant === "gallery" ? (
        <>
          <div className="absolute -left-1/4 -top-1/4 h-[80%] w-[80%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,rgba(240,240,240,0.4)_40%,transparent_100%)] blur-[80px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-[90%] w-[90%] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,rgba(245,158,11,0.02)_40%,transparent_100%)] blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_0%,rgba(244,244,245,0.3)_50%,transparent_100%)] blur-[90px]" />
        </>
      ) : (
        <>
          <div className="absolute left-1/2 top-1/3 h-[80%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,rgba(245,245,247,0.5)_50%,transparent_100%)] blur-[90px]" />
          <div className="absolute left-1/2 top-1/2 h-[50%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,rgba(245,158,11,0.01)_60%,transparent_100%)] blur-[120px]" />
          <div className="absolute -left-1/4 -bottom-1/4 h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle_at_center,rgba(228,228,231,0.2)_0%,rgba(244,244,245,0.05)_50%,transparent_100%)] blur-[80px]" />
        </>
      )}

      {/* 3. Sombreado editorial suave en los bordes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.015)_100%)]" />
    </div>
  );
}
