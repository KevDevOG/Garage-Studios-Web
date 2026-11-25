import type { ClienteEvolution, ClienteRow, ClientesMetrics, TopClienteRanking } from "@/app/actions/clientes";
import { Stat, StatStrip } from "@/components/admin/ui";
import ClientesLista from "@/components/admin/clientes/ClientesLista";
import ClientesRankings, { ClientesEvolucion } from "@/components/admin/clientes/ClientesRankings";
import { formatEUR } from "@/lib/format";

interface ClientesClientProps {
  view: "monthly" | "yearly";
  month: number;
  year: number;
  metrics: ClientesMetrics;
  topByRevenue: TopClienteRanking[];
  topByReservations: TopClienteRanking[];
  clientes: ClienteRow[];
  evolution?: ClienteEvolution[];
  initialQuery?: string;
}

/** Composición de la página: resumen, rankings, evolución anual y listado. Sin estado propio. */
export default function ClientesClient({
  view,
  month,
  year,
  metrics,
  topByRevenue,
  topByReservations,
  clientes,
  evolution = [],
  initialQuery = "",
}: ClientesClientProps) {
  const periodo = view === "monthly" ? "este mes" : "este año";
  const activos = metrics.nuevos + metrics.recurrentes;
  const pct = (n: number) => (activos > 0 ? `${Math.round((n / activos) * 100)} % de los clientes activos` : undefined);

  return (
    <div className="space-y-6">
      <StatStrip>
        <Stat label={view === "monthly" ? "Nuevos en el mes" : "Nuevos en el año"} value={metrics.nuevos} hint={pct(metrics.nuevos)} />
        <Stat
          label={view === "monthly" ? "Recurrentes en el mes" : "Recurrentes en el año"}
          value={metrics.recurrentes}
          hint={pct(metrics.recurrentes)}
        />
        <Stat label="Reservas del periodo" value={metrics.reservas} />
        <Stat label="Ingresos" value={formatEUR(metrics.ingresos)} tone="ok" />
        <Stat label="Ticket medio" value={formatEUR(metrics.ticketMedio)} />
      </StatStrip>

      <ClientesRankings topByRevenue={topByRevenue} topByReservations={topByReservations} periodLabel={periodo} />

      {view === "yearly" && (
        <ClientesEvolucion evolution={evolution} year={year} hasActivity={metrics.reservas > 0} />
      )}

      <ClientesLista clientes={clientes} view={view} month={month} year={year} initialQuery={initialQuery} />
    </div>
  );
}
