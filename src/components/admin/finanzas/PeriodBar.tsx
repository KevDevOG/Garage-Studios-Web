import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Segmented } from "@/components/admin/ui";
import { formatIsoDateEs, getZonedParts } from "@/lib/dates";
import YearJump from "./YearJump";

const pad = (n: number) => String(n).padStart(2, "0");

const STEP_LINK =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-gs-line-strong bg-gs-raised text-gs-soft transition-colors hover:text-gs-paper sm:size-9";

/** Barra de vista (mensual/anual) y navegación de periodo, en una sola línea. */
export default function PeriodBar({
  view,
  month,
  year,
}: {
  view: "mensual" | "anual";
  month: number;
  year: number;
}) {
  const href = (v: string, m: number, y: number) => `/admin/finanzas?view=${v}&month=${m}&year=${y}`;

  let prevHref: string;
  let nextHref: string;
  let prevLabel: string;
  let nextLabel: string;

  if (view === "mensual") {
    // Misma aritmética de mes que antes: diciembre → enero del año siguiente.
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear--;
    }
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    prevHref = href("mensual", prevMonth, prevYear);
    nextHref = href("mensual", nextMonth, nextYear);
    prevLabel = "Mes anterior";
    nextLabel = "Mes siguiente";
  } else {
    prevHref = href("anual", month, year - 1);
    nextHref = href("anual", month, year + 1);
    prevLabel = "Año anterior";
    nextLabel = "Año siguiente";
  }

  const monthName = formatIsoDateEs(`${year}-${pad(month)}-01`, { month: "long", year: "numeric" });

  const currentStudioYear = getZonedParts().year;
  const firstYear = Math.min(2025, year);
  const lastYear = Math.max(currentStudioYear + 1, year);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <Segmented
        label="Vista de finanzas"
        items={[
          { href: href("mensual", month, year), label: "Mensual", active: view === "mensual" },
          { href: href("anual", month, year), label: "Anual", active: view === "anual" },
        ]}
      />
      <div className="flex items-center gap-2">
        <Link href={prevHref} aria-label={prevLabel} title={prevLabel} className={STEP_LINK}>
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
        {view === "mensual" ? (
          <p aria-live="polite" className="min-w-[8.5rem] text-center text-[14px] font-medium text-gs-paper first-letter:uppercase">
            {monthName}
          </p>
        ) : (
          <YearJump year={year} month={month} years={years} />
        )}
        <Link href={nextHref} aria-label={nextLabel} title={nextLabel} className={STEP_LINK}>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}
