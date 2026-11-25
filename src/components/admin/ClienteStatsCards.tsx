import type { CommercialStats } from "@/app/actions/clientes";
import { Stat, StatStrip } from "./ui";
import { formatEUR } from "@/lib/format";

interface ClienteStatsCardsProps {
  stats: CommercialStats;
}

const fecha = (iso: string | null, vacio: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    : vacio;

export default function ClienteStatsCards({ stats }: ClienteStatsCardsProps) {
  return (
    <div className="space-y-3">
      <StatStrip>
        <Stat label="Total pagado" value={formatEUR(stats.totalPagado)} tone="ok" hint="Cobrado" />
        <Stat
          label="Pendiente"
          value={formatEUR(stats.importePendiente)}
          tone={stats.importePendiente > 0 ? "amber" : undefined}
          hint="Reservas por cobrar"
        />
        <Stat label="Ticket medio" value={formatEUR(stats.ticketMedioReal)} hint="Por cobro" />
        <Stat label="Servicio favorito" value={stats.servicioFavorito} hint="Más contratado" />
      </StatStrip>
      <StatStrip>
        <Stat label="Reservas" value={stats.totalReservas} />
        <Stat label="Completadas" value={stats.completadas} />
        <Stat label="Pendientes" value={stats.pendientes} />
        <Stat label="Canceladas" value={stats.canceladas} />
        <Stat label="Última reserva" value={fecha(stats.ultimaReserva, "Sin historial")} />
        <Stat label="Próxima reserva" value={fecha(stats.proximaReserva, "Ninguna")} />
      </StatStrip>
    </div>
  );
}
