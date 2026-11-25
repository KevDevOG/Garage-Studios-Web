"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { findSection } from "./AdminShell";

// Algunas páginas pasan títulos heredados en inglés; se muestran en español.
const DISPLAY_TITLES: Record<string, string> = {
  Dashboard: "Panel",
};

/**
 * Cabecera de cada página del panel: el h1 y, en las subpáginas, la ruta de
 * vuelta a su sección. La navegación, el modo compacto y el cierre de sesión
 * viven en AdminShell, así que este componente no necesita ningún provider.
 */
export default function AdminNav({ title }: { title: string }) {
  const pathname = usePathname();
  const section = findSection(pathname);
  const isSubpage = section !== undefined && pathname !== section.href;
  const shownTitle = DISPLAY_TITLES[title] ?? title;

  return (
    <header className="mb-8 border-b border-[#222326] pb-5">
      {isSubpage && (
        <nav aria-label="Ruta de navegación" className="-mt-2 mb-1 print:hidden">
          <Link
            href={section.href}
            className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-[#a3a6ab] hover:text-[#edebe4]"
          >
            {section.label}
            <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 text-[#6f7277]" />
          </Link>
        </nav>
      )}
      <h1 className="break-words text-balance font-[family-name:var(--font-admin)] text-[1.625rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[#edebe4] [font-stretch:112%] sm:text-[2rem]">
        {shownTitle}
      </h1>
    </header>
  );
}
