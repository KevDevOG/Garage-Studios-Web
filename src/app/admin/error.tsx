"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] Error no controlado", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-red-500/20 bg-card-bg p-8">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-400" aria-hidden="true" />
        <h1 className="text-xl font-black uppercase tracking-tight text-white">
          No se pudo cargar esta sección
        </h1>
        <p className="mt-3 text-sm text-muted">
          Se ha producido un error al cargar los datos del panel. Reintenta o vuelve al dashboard.
        </p>
        {error.digest && <p className="mt-2 text-[11px] text-muted">Referencia: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-accent-hover"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reintentar
          </button>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-card-border px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-accent hover:text-accent"
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
