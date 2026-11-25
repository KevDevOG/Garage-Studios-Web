import type { FinanceAnnualInsights, FinanceMovement, FinanceYearlySummary } from "@/app/actions/finanzas";
import { Stat, StatStrip } from "@/components/admin/ui";
import { plural, formatEUR } from "@/lib/format";
import AnnualView from "@/components/admin/finanzas/AnnualView";
import MovementsPanel from "@/components/admin/finanzas/MovementsPanel";
import PendingCollections, { type PendingReservation } from "@/components/admin/finanzas/PendingCollections";
import PeriodBar from "@/components/admin/finanzas/PeriodBar";

interface FinanzasClientProps {
  view: "mensual" | "anual";
  month: number;
  year: number;
  summary: { ingresos: number; gastos: number; beneficio: number; count: number; ticketMedio: number } | null;
  movements: FinanceMovement[];
  annualSummary: FinanceYearlySummary | null;
  annualInsights: FinanceAnnualInsights | null;
  pending: PendingReservation[] | null;
}

const EMPTY_SUMMARY = { ingresos: 0, gastos: 0, beneficio: 0, count: 0, ticketMedio: 0 };

/**
 * Composición de la sección de finanzas. Ya no necesita ser un Client Component:
 * solo los movimientos (filtro y borrado) y el selector de año tienen estado.
 */
export default function FinanzasClient({
  view,
  month,
  year,
  summary: summaryProp,
  movements,
  annualSummary,
  annualInsights,
  pending,
}: FinanzasClientProps) {
  const summary = summaryProp ?? EMPTY_SUMMARY;

  return (
    <div className="space-y-4">
      <PeriodBar view={view} month={month} year={year} />

      {view === "mensual" ? (
        <>
          <StatStrip>
            <Stat label="Ingresos" value={formatEUR(summary.ingresos)} tone="ok" />
            <Stat label="Gastos" value={formatEUR(summary.gastos)} tone="bad" />
            <Stat
              label="Beneficio neto"
              value={formatEUR(summary.beneficio)}
              tone={summary.beneficio >= 0 ? undefined : "bad"}
            />
            <Stat
              label="Ticket medio"
              value={formatEUR(summary.ticketMedio)}
              hint={plural(summary.count, "movimiento", "movimientos")}
            />
          </StatStrip>

          <PendingCollections reservations={pending} />

          <MovementsPanel movements={movements} />
        </>
      ) : (
        <AnnualView year={year} annualSummary={annualSummary} annualInsights={annualInsights} />
      )}
    </div>
  );
}
