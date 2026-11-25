import Link from "next/link";
import {
  hourMarks,
  layoutLanes,
  minutesLabel,
  openingMinutes,
  visibleRange,
  type AgendaEvent,
} from "@/lib/agenda";
import { formatIsoDateEs } from "@/lib/dates";
import { plural } from "@/lib/format";
import { cx } from "@/components/admin/ui";
import { clipClass } from "./events";
import NowLine from "./NowLine";

const HOUR_PX = 44;
const COLUMNS = "grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]";
const WEEKDAY: Intl.DateTimeFormatOptions = { weekday: "short" };
const LONG_DAY: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

/**
 * Semana en rejilla horaria: siete columnas (lunes a domingo) sobre la misma
 * escala de horas. Lo que queda fuera del horario de cada día va tramado y la
 * línea ámbar marca la hora actual en la columna de hoy.
 */
export default function WeekGrid({
  days,
  eventsByDay,
  today,
  nowMinutes,
  dayHref,
}: {
  days: string[];
  eventsByDay: Record<string, AgendaEvent[]>;
  today: string;
  nowMinutes: number;
  dayHref: (date: string) => string;
}) {
  const activeByDay = days.map((d) => (eventsByDay[d] ?? []).filter((e) => e.occupies));
  // Solo las sesiones amplían la ventana: un bloqueo de día completo (00:00 a
  // 23:59) no debe estirar la rejilla a 24 horas; se recorta a lo visible.
  const range = visibleRange(days, activeByDay.flat().filter((e) => e.kind !== "bloqueo"));
  const inWindow = (e: AgendaEvent) =>
    e.start !== null && e.start < range.end && (e.end ?? e.start + 60) > range.start;
  const total = range.end - range.start;
  const height = (total / 60) * HOUR_PX;
  const marks = hourMarks(range);
  const y = (minutes: number) => ((Math.min(Math.max(minutes, range.start), range.end) - range.start) / 60) * HOUR_PX;

  return (
    <div className="overflow-hidden rounded-lg border border-gs-line bg-gs-surface">
      {/* Cabecera de días */}
      <div className={cx(COLUMNS, "border-b border-gs-line")}>
        <div aria-hidden />
        {days.map((date, i) => {
          const isToday = date === today;
          const count = activeByDay[i].filter((e) => e.kind !== "bloqueo").length;
          return (
            <Link
              key={date}
              href={dayHref(date)}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${formatIsoDateEs(date, LONG_DAY)}${isToday ? ", hoy" : ""}: ${plural(count, "sesión", "sesiones")}. Abrir el día`}
              className={cx(
                "flex items-baseline gap-1.5 border-l border-gs-line px-2.5 py-2 hover:bg-white/[0.03]",
                isToday && "shadow-[inset_0_2px_0_var(--color-gs-amber)]",
              )}
            >
              <span className="text-[12px] text-gs-soft">{formatIsoDateEs(date, WEEKDAY).replace(".", "")}</span>
              <span
                className={cx(
                  "gs-display text-[16px] font-semibold leading-none",
                  isToday ? "text-gs-amber" : "text-gs-paper",
                )}
              >
                {Number(date.slice(8))}
              </span>
              {count > 0 && <span className="ml-auto text-[12px] text-gs-faint">{count}</span>}
            </Link>
          );
        })}
      </div>

      {/* Rejilla horaria */}
      <div className={COLUMNS} style={{ height }}>
        <div aria-hidden className="relative">
          {marks.slice(0, -1).map((t, i) => (
            <span
              key={t}
              className={cx(
                "absolute right-2 text-[12px] leading-none text-gs-faint",
                i === 0 ? "translate-y-1" : "-translate-y-1/2",
              )}
              style={{ top: y(t) }}
            >
              {minutesLabel(t)}
            </span>
          ))}
        </div>

        {days.map((date, i) => {
          const opening = openingMinutes(date);
          const placed = layoutLanes(activeByDay[i].filter(inWindow));
          return (
            <ol
              key={date}
              aria-label={formatIsoDateEs(date, LONG_DAY)}
              className="relative border-l border-gs-line"
              style={{
                backgroundImage: "linear-gradient(to bottom, var(--color-gs-line) 1px, transparent 1px)",
                backgroundSize: `100% ${HOUR_PX}px`,
              }}
            >
              {/* Fuera de horario */}
              {!opening && <li aria-hidden className="gs-hatch absolute inset-0" />}
              {opening && opening.open > range.start && (
                <li aria-hidden className="gs-hatch absolute inset-x-0 top-0" style={{ height: y(opening.open) }} />
              )}
              {opening && opening.close < range.end && (
                <li aria-hidden className="gs-hatch absolute inset-x-0 bottom-0" style={{ top: y(opening.close) }} />
              )}

              {placed.map(({ event, lane, lanes }) => {
                const start = event.start as number;
                const end = event.end ?? start + 60;
                const top = y(start);
                const clipHeight = Math.max(y(end) - top - 2, 20);
                const label = `${minutesLabel(start)} a ${minutesLabel(end)}, ${event.title}${event.subtitle ? `, ${event.subtitle}` : ""}, ${event.statusLabel}`;                const clip = cx(
                  "block h-full overflow-hidden rounded-[4px] border-l-[3px] px-1.5 py-1 text-[12px] leading-[1.25]",
                  clipClass(event),
                );
                const inner =
                  clipHeight >= 38 ? (
                    <>
                      <span className="block truncate text-gs-soft">{minutesLabel(start)}</span>
                      <span className="block truncate font-semibold text-gs-paper">{event.title}</span>
                      {clipHeight >= 60 && event.subtitle && (
                        <span className="block truncate text-gs-soft">{event.subtitle}</span>
                      )}
                    </>
                  ) : (
                    <span className="block truncate">
                      <span className="text-gs-soft">{minutesLabel(start)}</span>{" "}
                      <span className="font-semibold text-gs-paper">{event.title}</span>
                    </span>
                  );
                return (
                  <li
                    key={event.id}
                    className="absolute z-10 px-0.5"
                    style={{
                      top: top + 1,
                      height: clipHeight,
                      left: `${(lane / lanes) * 100}%`,
                      width: `${100 / lanes}%`,
                    }}
                  >
                    {event.href ? (
                      <Link href={event.href} aria-label={label} title={label} className={clip}>
                        {inner}
                      </Link>
                    ) : (
                      <span aria-label={label} title={label} className={clip}>
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}

              {date === today && (
                <li aria-hidden className="pointer-events-none absolute inset-0">
                  <NowLine rangeStart={range.start} rangeEnd={range.end} initialMinutes={nowMinutes} axis="y" />
                </li>
              )}
            </ol>
          );
        })}
      </div>
    </div>
  );
}
