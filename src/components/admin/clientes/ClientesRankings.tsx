import Link from "next/link";
import type { ClienteEvolution, TopClienteRanking } from "@/app/actions/clientes";
import { EmptyState, Panel, table, textLink, cx } from "@/components/admin/ui";
import { formatEUR, plural } from "@/lib/format";

function RankingList({
  items,
  empty,
  primary,
}: {
  items: TopClienteRanking[];
  empty: string;
  primary: "importe" | "reservas";
}) {
  if (items.length === 0) return <EmptyState title={empty} />;
  return (
    <ol className="divide-y divide-gs-line">
      {items.map((c, i) => (
        <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
          <span aria-hidden className="w-4 shrink-0 text-[12px] tabular-nums text-gs-faint">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <Link href={`/admin/clientes/${c.id}`} className={cx("block truncate text-[14px] font-medium", textLink)}>
              {c.nombre}
            </Link>
            <p className="truncate text-[12px] text-gs-faint">
              {c.ultimo_servicio || "Servicio sin especificar"}
              {c.es_recurrente ? ", recurrente" : ""}
            </p>
          </div>
          <div className="shrink-0 text-right tabular-nums">
            {primary === "importe" ? (
              <>
                <p className="text-[14px] font-medium text-gs-ok">{formatEUR(c.total_pagado)}</p>
                <p className="text-[12px] text-gs-faint">{plural(c.reservas, "reserva", "reservas")}</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-gs-paper">{plural(c.reservas, "reserva", "reservas")}</p>
                <p className="text-[12px] text-gs-faint">{formatEUR(c.total_pagado)}</p>
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ClientesRankings({
  topByRevenue,
  topByReservations,
  periodLabel,
}: {
  topByRevenue: TopClienteRanking[];
  topByReservations: TopClienteRanking[];
  /** "este mes" o "este año" */
  periodLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Mayores ingresos" flush>
        <RankingList items={topByRevenue} primary="importe" empty={`Sin ingresos ${periodLabel}`} />
      </Panel>
      <Panel title="Más reservas" flush>
        <RankingList items={topByReservations} primary="reservas" empty={`Sin actividad ${periodLabel}`} />
      </Panel>
    </div>
  );
}

export function ClientesEvolucion({
  evolution,
  year,
  hasActivity,
}: {
  evolution: ClienteEvolution[];
  year: number;
  hasActivity: boolean;
}) {
  return (
    <details className="group rounded-lg border border-gs-line bg-gs-surface">
      <summary className="flex min-h-11 cursor-pointer items-center px-4 text-[14px] font-semibold text-gs-paper">
        Evolución mensual de {year}
      </summary>
      {evolution.length > 0 && hasActivity ? (
        <div className="overflow-x-auto border-t border-gs-line">
          <table className={table.table}>
            <caption className="sr-only">Clientes nuevos, reservas e ingresos por mes en {year}</caption>
            <thead>
              <tr>
                <th scope="col" className={table.th}>Mes</th>
                <th scope="col" className={cx(table.th, table.num)}>Nuevos</th>
                <th scope="col" className={cx(table.th, table.num)}>Reservas</th>
                <th scope="col" className={cx(table.th, table.num)}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {evolution.map((m, i) => (
                <tr key={`${m.month}-${i}`} className={table.tr}>
                  <th scope="row" className={cx(table.td, "text-left font-normal")}>{m.month}</th>
                  <td className={cx(table.td, table.num)}>{m.nuevos}</td>
                  <td className={cx(table.td, table.num)}>{m.reservas}</td>
                  <td className={cx(table.td, table.num, m.ingresos > 0 ? "text-gs-ok" : "text-gs-faint")}>
                    {formatEUR(m.ingresos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState className="border-t border-gs-line" title={`Sin datos de clientes en ${year}`} />
      )}
    </details>
  );
}
