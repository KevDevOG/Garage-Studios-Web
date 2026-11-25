import type { FinanceAnnualInsights, FinanceTopEntry, FinanceYearlySummary } from "@/app/actions/finanzas";
import { EmptyState, Panel, Stat, StatStrip, table, cx } from "@/components/admin/ui";
import { formatEUR, plural } from "@/lib/format";
import { formatIsoDateEs } from "@/lib/dates";

const pad = (n: number) => String(n).padStart(2, "0");

function Insight({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0 bg-gs-surface px-4 py-3">
      <dt className="text-[12px] text-gs-soft">{label}</dt>
      <dd className="mt-1 truncate text-[14px] font-medium text-gs-paper first-letter:uppercase" title={value}>
        {value}
      </dd>
      {detail && <p className="mt-0.5 truncate text-[12px] tabular-nums text-gs-faint">{detail}</p>}
    </div>
  );
}

/** Vista anual: resumen, evolución mensual, detalle por mes y destacados. Sin estado. */
export default function AnnualView({
  year,
  annualSummary,
  annualInsights,
}: {
  year: number;
  annualSummary: FinanceYearlySummary | null;
  annualInsights: FinanceAnnualInsights | null;
}) {
  if (!annualSummary || !annualInsights) {
    return (
      <Panel flush>
        <EmptyState
          title="No hay datos para este año"
          hint="Prueba con otro año desde el selector o registra movimientos para empezar."
        />
      </Panel>
    );
  }

  const monthLabel = (m: number, style: "long" | "short") =>
    formatIsoDateEs(`${year}-${pad(m)}-01`, { month: style });

  // Escala del gráfico anual: el mayor importe mensual (ingresos o gastos).
  const chartMax = Math.max(...annualSummary.evolution.flatMap((s) => [s.ingresos, s.gastos]), 1);

  const topAmount = (entry: FinanceTopEntry) => (entry ? formatEUR(entry[1]) : undefined);

  return (
    <div className="space-y-4">
      <StatStrip>
        <Stat label={`Ingresos ${year}`} value={formatEUR(annualSummary.ingresosTotal)} tone="ok" />
        <Stat label={`Gastos ${year}`} value={formatEUR(annualSummary.gastosTotal)} tone="bad" />
        <Stat
          label="Beneficio anual"
          value={formatEUR(annualSummary.beneficioTotal)}
          tone={annualSummary.beneficioTotal >= 0 ? undefined : "bad"}
        />
        <Stat
          label="Ticket medio"
          value={formatEUR(annualSummary.ticketMedio)}
          hint={plural(annualSummary.movimientosCount, "movimiento", "movimientos")}
        />
      </StatStrip>

      <Panel
        title="Evolución mensual"
        meta={String(year)}
        action={
          <ul className="flex items-center gap-4 text-[12px] text-gs-soft">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-gs-ok" />
              Ingresos
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-gs-bad" />
              Gastos
            </li>
          </ul>
        }
      >
        <div className="flex h-44 items-end gap-1 sm:gap-2 sm:px-1">
          {annualSummary.evolution.map((stat) => {
            const incomeH = (stat.ingresos / chartMax) * 100;
            const expH = (stat.gastos / chartMax) * 100;
            const label = monthLabel(stat.mes, "long");

            return (
              <div
                key={stat.mes}
                role="img"
                aria-label={`${label}: ingresos ${formatEUR(stat.ingresos)}, gastos ${formatEUR(stat.gastos)}`}
                title={`${label}: ingresos ${formatEUR(stat.ingresos)}, gastos ${formatEUR(stat.gastos)}`}
                className="flex h-full min-w-0 flex-1 flex-col justify-end"
              >
                <div className="flex h-full items-end justify-center gap-0.5">
                  <div className="w-full max-w-[12px] rounded-t-sm bg-gs-ok" style={{ height: `${incomeH}%` }} />
                  <div className="w-full max-w-[12px] rounded-t-sm bg-gs-bad" style={{ height: `${expH}%` }} />
                </div>
                <span className="mt-2 text-center text-[12px] text-gs-faint">
                  {monthLabel(stat.mes, "short").replace(".", "").substring(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Detalle por mes" meta={String(year)} flush>
        <div className="overflow-x-auto">
          <table className={table.table}>
            <thead>
              <tr>
                <th scope="col" className={table.th}>Mes</th>
                <th scope="col" className={cx(table.th, "text-right")}>Ingresos</th>
                <th scope="col" className={cx(table.th, "text-right")}>Gastos</th>
                <th scope="col" className={cx(table.th, "text-right")}>Beneficio</th>
              </tr>
            </thead>
            <tbody>
              {annualSummary.evolution.map((stat) => (
                <tr key={stat.mes} className={table.tr}>
                  <th scope="row" className={cx(table.td, "text-left font-normal first-letter:uppercase")}>
                    {monthLabel(stat.mes, "long")}
                  </th>
                  <td className={cx(table.td, table.num, "text-gs-ok")}>{formatEUR(stat.ingresos)}</td>
                  <td className={cx(table.td, table.num, "text-gs-bad")}>{formatEUR(stat.gastos)}</td>
                  <td className={cx(table.td, table.num, stat.beneficio < 0 && "text-gs-bad")}>
                    {formatEUR(stat.beneficio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Destacados" meta={String(year)} flush>
        <dl className="grid grid-cols-1 gap-px bg-gs-line sm:grid-cols-2 lg:grid-cols-3">
          <Insight
            label="Mejor mes (ingresos)"
            value={annualSummary.bestMonth ? monthLabel(annualSummary.bestMonth.mes, "long") : "—"}
            detail={annualSummary.bestMonth ? formatEUR(annualSummary.bestMonth.ingresos) : undefined}
          />
          <Insight
            label="Mes con menos ingresos"
            value={annualSummary.worstMonth ? monthLabel(annualSummary.worstMonth.mes, "long") : "—"}
            detail={annualSummary.worstMonth ? formatEUR(annualSummary.worstMonth.ingresos) : undefined}
          />
          <Insight
            label="Servicio estrella"
            value={annualInsights.topService?.[0] || "—"}
            detail={topAmount(annualInsights.topService)}
          />
          <Insight
            label="Mejor cliente"
            value={annualInsights.topClient?.[0] || "—"}
            detail={topAmount(annualInsights.topClient)}
          />
          <Insight
            label="Mayor categoría de gasto"
            value={annualInsights.topSpendingCategory?.[0] || "—"}
            detail={topAmount(annualInsights.topSpendingCategory)}
          />
          <Insight
            label="Método preferido"
            value={annualInsights.mostUsedPaymentMethod?.[0] || "—"}
            detail={
              annualInsights.mostUsedPaymentMethod
                ? plural(annualInsights.mostUsedPaymentMethod[1], "cobro", "cobros")
                : undefined
            }
          />
        </dl>
      </Panel>
    </div>
  );
}
