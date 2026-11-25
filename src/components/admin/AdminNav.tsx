"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { findSection } from "./AdminShell";

/**
 * Cabecera de cada página del panel: ruta de vuelta (en subpáginas), h1,
 * descripción opcional y las acciones de la página a la derecha.
 * La navegación, el modo compacto y el cierre de sesión viven en AdminShell.
 */
export default function AdminNav({
  title,
  description,
  actions,
}: {
  title: string;
  /** Una línea bajo el título: contexto o recuento, no un eslogan. */
  description?: ReactNode;
  /** Botones de la página (crear, exportar…). En móvil pasan debajo del título. */
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const section = findSection(pathname);
  const isSubpage = section !== undefined && pathname !== section.href;

  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-gs-line pb-4">
      <div className="min-w-0">
        {isSubpage && (
          <nav aria-label="Ruta de navegación" className="-mt-1 print:hidden">
            <Link
              href={section.href}
              className="inline-flex min-h-9 items-center gap-1 text-[13px] text-gs-soft hover:text-gs-paper"
            >
              {section.label}
              <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5 text-[#6f7277]" />
            </Link>
          </nav>
        )}
        <h1 className="gs-display break-words text-balance text-[1.5rem] font-semibold leading-[1.15] text-gs-paper sm:text-[1.75rem]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-[13px] leading-snug text-gs-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </header>
  );
}
