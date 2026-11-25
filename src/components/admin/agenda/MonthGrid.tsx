import Link from "next/link";
import { minutesLabel, visibleRange, type AgendaEvent } from "@/lib/agenda";
import { formatIsoDateEs } from "@/lib/dates";
import { plural } from "@/lib/format";
import { cx } from "@/components/admin/ui";
import DayTrack from "./DayTrack";
import { CLIP_SOLID } from "./events";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const LONG_DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
const MAX_CHIPS = 3;

/**
 * Mes en rejilla: cada día muestra su ocupación en una pista mínima y, en
 * escritorio, las primeras sesiones. Pulsar un día abre su vista diaria.
 */
export default function MonthGrid({
  weeks,
  month,
  eventsByDay,
  today,
  dayHref,
}: {
  weeks: string[][];
  /** Mes mostrado, "YYYY-MM": los días de otros meses se atenúan. */
  month: string;
  eventsByDay: Record<string, AgendaEvent[]>;
  today: string;
  dayHref: (date: string) => string;
}) {
  // Misma escala horaria para todas las pistas del mes.
  const range = visibleRange(weeks[1] ?? weeks[0]);

  return (
    <div className="overflow-hidden rounded-lg border border-gs-line bg-gs-surface">
      <div aria-hidden className="grid grid-cols-7 border-b border-gs-line">
        {WEEKDAYS.map((name) => (
          <span key={name} className="px-2 py-2 text-[12px] text-gs-faint">
            {name}
          </span>
        ))}
      </div>

      <ol className="grid grid-cols-7 [&>li:nth-child(-n+7)]:border-t-0 [&>li:nth-child(7n+1)]:border-l-0">
        {weeks.flat().map((date) => {
          const events = (eventsByDay[date] ?? []).filter((e) => e.occupies);
          const sessions = events.filter((e) => e.kind !== "bloqueo");
          const isToday = date === today;
          const outside = date.slice(0, 7) !== month;
          const chips = events.filter((e) => e.start !== null).slice(0, MAX_CHIPS);
          const more = events.length - chips.length;

          return (
            <li
              key={date}
              className={cx(
                "relative min-h-[4.5rem] border-l border-t border-gs-line p-1.5 hover:bg-white/[0.025] lg:min-h-[7.25rem]",
                outside && "bg-gs-canvas/60",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <Link
                  href={dayHref(date)}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${formatIsoDateEs(date, LONG_DAY)}${isToday ? ", hoy" : ""}: ${plural(sessions.length, "sesión", "sesiones")}`}
                  className={cx(
                    "inline-flex size-7 items-center justify-center rounded-full text-[13px] leading-none after:absolute after:inset-0",
                    isToday
                      ? "bg-gs-amber font-semibold text-[#17120a]"
                      : outside
                        ? "text-[#63666b]"
                        : "font-medium text-gs-paper",
                  )}
                >
                  {Number(date.slice(8))}
                </Link>
                {sessions.length > 0 && (
                  <span aria-hidden className="pr-0.5 text-[12px] text-gs-faint lg:hidden">
                    {sessions.length}
                  </span>
                )}
              </div>

              {events.length > 0 && <DayTrack date={date} events={events} size="xs" range={range} className="mt-1.5" />}

              {chips.length > 0 && (
                <ul className="mt-1.5 hidden space-y-px lg:block">
                  {chips.map((event) => {
                    const content = (
                      <>
                        <span
                          aria-hidden
                          className={cx(
                            "size-1.5 shrink-0 rounded-full",
                            event.kind === "bloqueo" ? "bg-[#6f7277]" : CLIP_SOLID[event.tone],
                          )}
                        />
                        <span className="shrink-0 text-gs-soft">{minutesLabel(event.start as number)}</span>
                        <span className="truncate text-gs-paper">{event.title}</span>
                      </>
                    );
                    const chip = "relative z-10 flex items-center gap-1.5 rounded px-1 py-0.5 text-[12px] leading-tight";
                    return (
                      <li key={event.id}>
                        {event.href && event.kind !== "bloqueo" ? (
                          <Link
                            href={event.href}
                            title={`${event.title}${event.subtitle ? `, ${event.subtitle}` : ""}, ${event.statusLabel}`}
                            className={cx(chip, "hover:bg-white/[0.07]")}
                          >
                            {content}
                          </Link>
                        ) : (
                          <span className={chip}>{content}</span>
                        )}
                      </li>
                    );
                  })}
                  {more > 0 && <li className="px-1 text-[12px] text-gs-faint">y {more} más</li>}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
