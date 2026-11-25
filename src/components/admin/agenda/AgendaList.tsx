import Link from "next/link";
import { Lock } from "lucide-react";
import type { AgendaEvent } from "@/lib/agenda";
import { formatIsoDateEs } from "@/lib/dates";
import { capitalizeFirst, plural } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import CalendarReservationCard from "@/components/admin/CalendarReservationCard";
import DeleteBloqueoButton from "@/components/admin/DeleteBloqueoButton";
import { cx } from "@/components/admin/ui";
import DayTrack from "./DayTrack";
import type { ManualBlock, SessionRowData } from "./events";

export type AgendaItem =
  | { kind: "reserva"; time: string | null; row: SessionRowData }
  | { kind: "bloqueo"; time: string | null; block: ManualBlock };

const LONG_DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/** Fila de unas horas bloqueadas a mano. */
function BlockedRow({ block }: { block: ManualBlock }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 lg:flex-row lg:items-center">
        <div className="shrink-0 text-[14px] font-semibold text-gs-paper lg:w-[7.25rem]">
          {formatTime(block.hora_inicio)}
          <span className="font-normal text-gs-faint"> a {formatTime(block.hora_fin)}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[14px] text-gs-soft">
          <Lock aria-hidden className="size-4 shrink-0 text-gs-faint" />
          <span className="break-words">
            <span className="font-medium text-gs-paper">Horas bloqueadas</span>
            {block.motivo ? `: ${block.motivo}` : ""}
          </span>
        </div>
      </div>
      <DeleteBloqueoButton id={block.id} />
    </li>
  );
}

/**
 * Sesiones y bloqueos agrupados por día, con sus acciones. En móvil es la
 * vista principal de la semana; en escritorio acompaña a la rejilla.
 */
export default function AgendaList({
  days,
  itemsByDay,
  eventsByDay,
  today,
  dayHref,
  showDayHeaders = true,
}: {
  days: string[];
  itemsByDay: Record<string, AgendaItem[]>;
  eventsByDay: Record<string, AgendaEvent[]>;
  today: string;
  dayHref: (date: string) => string;
  /** Falso en la vista de un solo día (el título ya dice qué día es). */
  showDayHeaders?: boolean;
}) {
  const daysWithItems = days.filter((d) => (itemsByDay[d]?.length ?? 0) > 0);

  return (
    <div className="divide-y divide-gs-line">
      {daysWithItems.map((date) => {
        const items = itemsByDay[date];
        const sessions = items.filter((i) => i.kind === "reserva").length;
        const isToday = date === today;
        return (
          <section key={date} aria-label={formatIsoDateEs(date, LONG_DAY)}>
            {showDayHeaders && (
              <header className="flex items-center gap-3 bg-gs-raised/50 px-4 py-2">
                <h3 className="text-[13px] font-semibold text-gs-paper">
                  <Link href={dayHref(date)} className="underline-offset-4 hover:underline">
                    {capitalizeFirst(formatIsoDateEs(date, LONG_DAY))}
                  </Link>
                  {isToday && <span className="ml-2 font-medium text-gs-amber">Hoy</span>}
                </h3>
                <DayTrack
                  date={date}
                  events={eventsByDay[date] ?? []}
                  size="xs"
                  className="hidden w-28 shrink-0 sm:block"
                />
                <span className="ml-auto shrink-0 text-[12px] text-gs-faint">
                  {plural(sessions, "sesión", "sesiones")}
                </span>
              </header>
            )}
            <ul className={cx("divide-y divide-gs-line")}>
              {items.map((item) =>
                item.kind === "bloqueo" ? (
                  <BlockedRow key={`b-${item.block.id}`} block={item.block} />
                ) : (
                  <CalendarReservationCard key={item.row.id} reservation={item.row} />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
