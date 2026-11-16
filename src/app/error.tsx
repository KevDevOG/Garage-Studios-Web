"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // El mensaje real queda en los logs del servidor; aquí solo el identificador.
    console.error("[App] Error no controlado", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
      <AlertTriangle className="mb-6 h-14 w-14 text-accent" aria-hidden="true" />
      <h1 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
        Algo se ha <span className="text-accent">desafinado</span>
      </h1>
      <p className="mt-6 max-w-md text-base font-medium text-muted">
        Ha ocurrido un error inesperado. Puedes volver a intentarlo o escribirnos por WhatsApp si
        necesitas ayuda con tu reserva.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-muted">Referencia: {error.digest}</p>
      )}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:border-white/40 hover:bg-white/10"
        >
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}
