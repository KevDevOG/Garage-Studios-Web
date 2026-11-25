"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getZonedParts } from "@/lib/dates";
import { Segmented } from "@/components/admin/ui";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ICON_LINK =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-gs-line-strong bg-gs-raised text-gs-paper hover:border-[#484b51] hover:bg-[#212328] sm:size-8";

/** Selector de periodo: vista mensual/anual, mes y año. Conserva la búsqueda (?q=). */
export default function ClientesPeriodo({
  view,
  month,
  year,
  query,
}: {
  view: "monthly" | "yearly";
  month: number;
  year: number;
  query: string;
}) {
  const router = useRouter();
  const q = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
  const base = "/admin/clientes";

  const hrefFor = (nextView: "monthly" | "yearly", m: number, y: number) =>
    `${base}?view=${nextView}&year=${y}${nextView === "monthly" ? `&month=${m}` : ""}${q}`;

  const shift = (delta: number) => {
    if (view === "monthly") {
      let m = month + delta;
      let y = year;
      if (m > 12) { m = 1; y++; }
      else if (m < 1) { m = 12; y--; }
      return hrefFor("monthly", m, y);
    }
    return hrefFor("yearly", month, year + delta);
  };

  const currentYear = getZonedParts().year;
  const years = Array.from({ length: currentYear + 1 - 2025 + 1 }, (_, i) => 2025 + i);

  return (
    <>
      <Segmented
        label="Vista del periodo"
        items={[
          { href: hrefFor("monthly", month, year), label: "Mensual", active: view === "monthly" },
          { href: hrefFor("yearly", month, year), label: "Anual", active: view === "yearly" },
        ]}
      />
      <div className="flex items-center gap-1.5">
        <Link href={shift(-1)} aria-label={view === "monthly" ? "Mes anterior" : "Año anterior"} className={ICON_LINK}>
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
        {view === "monthly" && (
          <select
            aria-label="Mes"
            value={month}
            onChange={(e) => router.push(hrefFor("monthly", Number(e.target.value), year))}
            className="w-auto"
          >
            {MESES.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        )}
        <select
          aria-label="Año"
          value={year}
          onChange={(e) => router.push(hrefFor(view, month, Number(e.target.value)))}
          className="w-auto"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <Link href={shift(1)} aria-label={view === "monthly" ? "Mes siguiente" : "Año siguiente"} className={ICON_LINK}>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>
    </>
  );
}
