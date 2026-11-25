import { minutesLabel, openingMinutes, type AgendaEvent } from "@/lib/agenda";
import { formatIsoDateEs } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";
import DayTrack from "./agenda/DayTrack";
import type { SessionRowData } from "./agenda/events";
import CalendarReservationCard from "./CalendarReservationCard";
import { EmptyState, LinkButton, Notice, Panel } from "./ui";

interface TodayAtGarageProps {
  today: string;
  nowMinutes: number;
  /** Sesiones de hoy (reservas y bloques de pack), ordenadas por hora. */
  sessions: SessionRowData[];
  /** Sesiones y bloqueos de hoy, para la pista. */
  events: AgendaEvent[];
  /** Próxima sesión futura, para el mensaje de día vacío. */
  next?: SessionRowData;
  /** Alguna consulta de hoy falló: no se afirma que el día esté vacío. */
  failed?: boolean;
}

const NEXT_DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/** El día de hoy: la pista con el horario y, debajo, cada sesión con su siguiente paso. */
export default function TodayAtGarage({ today, nowMinutes, sessions, events, next, failed }: TodayAtGarageProps) {
  const opening = openingMinutes(today);

  return (
    <Panel
      flush
      title="Hoy en el estudio"
      meta={opening ? `Abierto de ${minutesLabel(opening.open)} a ${minutesLabel(opening.close)}` : "Cerrado"}
      action={
        <LinkButton href={`/admin/calendario?view=dia&fecha=${today}`} variant="ghost" size="sm">
          Ver el día
        </LinkButton>
      }
    >
      {failed ? (
        <div className="p-4">
          <Notice title="No se pudo cargar la agenda de hoy">
            Recarga la página. Mientras tanto, no des por hecho que el día está libre.
          </Notice>
        </div>
      ) : (
        <>
          <div className="px-4 pb-3 pt-4">
            <DayTrack date={today} events={events} nowMinutes={nowMinutes} />
          </div>
          {sessions.length === 0 ? (
            <EmptyState
              className="border-t border-gs-line"
              title="Hoy no hay sesiones"
              hint={
                next
                  ? `La próxima es el ${formatIsoDateEs(next.fecha_reserva, NEXT_DAY)} a las ${formatTime(next.hora_inicio)}, con ${next.nombre}.`
                  : "Tampoco hay sesiones futuras apuntadas."
              }
            />
          ) : (
            <ul className="divide-y divide-gs-line border-t border-gs-line">
              {sessions.map((res) => (
                <CalendarReservationCard key={res.id} reservation={res} />
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
