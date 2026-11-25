import Link from "next/link";
import { formatIsoDateEs } from "@/lib/dates";
import { capitalizeFirst } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import type { SessionRowData } from "./agenda/events";
import StatusBadge from "./StatusBadge";
import { EmptyState, LinkButton, Notice, Panel } from "./ui";

interface UpcomingAppointmentsProps {
  reservations: SessionRowData[];
  failed?: boolean;
}

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/** Próximas sesiones (pendientes o confirmadas) a partir de mañana. */
export default function UpcomingAppointments({ reservations, failed }: UpcomingAppointmentsProps) {
  return (
    <Panel
      flush
      title="Próximas sesiones"
      action={
        <LinkButton href="/admin/calendario" variant="ghost" size="sm">
          Abrir calendario
        </LinkButton>
      }
    >
      {failed ? (
        <div className="p-4">
          <Notice title="No se pudieron cargar las próximas sesiones">Recarga la página para reintentarlo.</Notice>
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState title="No hay sesiones futuras" hint="Cuando entre una reserva para otro día aparecerá aquí." />
      ) : (
        <ul className="divide-y divide-gs-line">
          {reservations.map((res) => (
            <li key={res.id}>
              <Link
                href={`/admin/calendario/${res.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03]"
              >
                <span className="flex w-[5.75rem] shrink-0 flex-col gap-0.5 sm:w-[10rem] sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="text-[13px] text-gs-soft sm:w-[6rem]">
                    {capitalizeFirst(formatIsoDateEs(res.fecha_reserva, DAY))}
                  </span>
                  <span className="text-[13px] font-semibold text-gs-paper">{formatTime(res.hora_inicio)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-gs-paper">{res.nombre}</span>
                  <span className="block truncate text-[12px] text-gs-faint">
                    {res.servicio?.nombre || "Servicio sin especificar"}
                  </span>
                </span>
                <StatusBadge type="reserva" value={res.estado} plain className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
