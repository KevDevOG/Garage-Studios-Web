"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Page, Notice, buttonClass } from "@/components/admin/ui";

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
    <Page width="narrow">
      <Notice title="No se pudo cargar esta sección">
        <p>Se ha producido un error al cargar los datos del panel. Reintenta o vuelve al panel.</p>
        {error.digest && <p className="mt-1 text-[12px] text-gs-faint">Referencia: {error.digest}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={reset} className={buttonClass("secondary", "md")}>
            <RotateCcw aria-hidden="true" /> Reintentar
          </button>
          <Link href="/admin/dashboard" className={buttonClass("ghost", "md")}>
            Ir al panel
          </Link>
        </div>
      </Notice>
    </Page>
  );
}
