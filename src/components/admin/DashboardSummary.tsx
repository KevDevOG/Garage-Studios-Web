import { formatEUR, formatEURRound, plural } from "@/lib/format";
import { Stat, StatStrip } from "./ui";

export interface SummaryStats {
  /** Sesiones de hoy que ocupan hueco; null si no se pudo consultar. */
  hoy: number | null;
  porConfirmar: number | null;
  /** Reservas con cobro pendiente y el total que falta; null si falló. */
  cobros: { count: number; total: number } | null;
  ingresosMes: number | null;
  mensajes: number | null;
}

const NO_DATA = "Sin datos";

/**
 * Cifras del día en una sola tira. Una cifra que no se pudo consultar se
 * muestra como "Sin datos", nunca como cero.
 */
export default function DashboardSummary({ stats }: { stats: SummaryStats }) {
  return (
    <StatStrip>
      <Stat label="Sesiones hoy" value={stats.hoy ?? NO_DATA} />
      <Stat
        label="Por confirmar"
        value={stats.porConfirmar ?? NO_DATA}
        tone={stats.porConfirmar ? "amber" : undefined}
      />
      <Stat
        label="Por cobrar"
        value={stats.cobros ? formatEURRound(stats.cobros.total) : NO_DATA}
        hint={stats.cobros ? plural(stats.cobros.count, "reserva", "reservas") : undefined}
      />
      <Stat
        label="Ingresos del mes"
        value={stats.ingresosMes === null ? NO_DATA : formatEUR(stats.ingresosMes)}
        tone={stats.ingresosMes ? "ok" : undefined}
      />
      <Stat
        label="Mensajes sin leer"
        value={stats.mensajes ?? NO_DATA}
        tone={stats.mensajes ? "amber" : undefined}
      />
    </StatStrip>
  );
}
