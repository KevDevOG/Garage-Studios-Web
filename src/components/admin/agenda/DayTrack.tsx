import Link from "next/link";
import {
  hourMarks,
  layoutLanes,
  minutesLabel,
  openingMinutes,
  spanPercent,
  visibleRange,
  type AgendaEvent,
} from "@/lib/agenda";
import { cx } from "@/components/admin/ui";
import { CLIP_SOLID, clipClass } from "./events";
import NowLine from "./NowLine";

/**
 * Pista del día: el horario del estudio como la pista de un multipistas.
 * La zona abierta queda limpia, lo cerrado va tramado, cada sesión es un clip
 * en su hora y el cabezal ámbar marca el ahora.
 *
 *  · size "lg": pista completa con regla de horas y clips enlazados.
 *  · size "xs": tira de ocupación de 6px, decorativa (el dato va en texto).
 */
export default function DayTrack({
  date,
  events,
  size = "lg",
  nowMinutes,
  range: rangeProp,
  className,
}: {
  date: string;
  events: AgendaEvent[];
  size?: "lg" | "xs";
  /** Minutos actuales del estudio; pásalo solo si `date` es hoy. */
  nowMinutes?: number;
  /** Ventana horaria fija (para alinear varias pistas entre sí). */
  range?: { start: number; end: number };
  className?: string;
}) {
  const timed = events.filter((e) => e.occupies && e.start !== null);
  // Solo las sesiones amplían la ventana; los bloqueos se recortan a lo visible.
  const range = rangeProp ?? visibleRange([date], timed.filter((e) => e.kind !== "bloqueo"));
  const active = timed.filter(
    (e) => (e.start as number) < range.end && (e.end ?? (e.start as number) + 60) > range.start,
  );
  const opening = openingMinutes(date);

  if (size === "xs") {
    const open = opening ? spanPercent(opening.open, opening.close, range) : null;
    return (
      <div aria-hidden className={cx("relative h-1.5 overflow-hidden rounded-full bg-gs-sunken", className)}>
        {open && (
          <span
            className="absolute inset-y-0 bg-gs-line-strong/70"
            style={{ left: `${open.offset}%`, width: `${open.size}%` }}
          />
        )}
        {active.map((e) => {
          const span = spanPercent(e.start as number, e.end ?? (e.start as number) + 60, range);
          return (
            <span
              key={e.id}
              className={cx("absolute inset-y-0 rounded-[1px]", e.kind === "bloqueo" ? "bg-[#6f7277]" : CLIP_SOLID[e.tone])}
              style={{ left: `${span.offset}%`, width: `${Math.max(span.size, 2)}%` }}
            />
          );
        })}
      </div>
    );
  }

  const placed = layoutLanes(active);
  const marks = hourMarks(range);
  const closedBefore = opening ? spanPercent(range.start, opening.open, range) : null;
  const closedAfter = opening ? spanPercent(opening.close, range.end, range) : null;
  const dense = marks.length > 9;

  return (
    <div className={className}>
      <div className="relative h-[4.5rem] overflow-hidden rounded-md border border-gs-line bg-gs-sunken">
        {/* Fuera de horario */}
        {!opening && <span aria-hidden className="gs-hatch absolute inset-0" />}
        {closedBefore && closedBefore.size > 0 && (
          <span aria-hidden className="gs-hatch absolute inset-y-0 left-0" style={{ width: `${closedBefore.size}%` }} />
        )}
        {closedAfter && closedAfter.size > 0 && (
          <span aria-hidden className="gs-hatch absolute inset-y-0 right-0" style={{ width: `${closedAfter.size}%` }} />
        )}

        {/* Marcas de hora */}
        {marks.slice(1, -1).map((t) => (
          <span
            key={t}
            aria-hidden
            className="absolute inset-y-0 w-px bg-gs-line"
            style={{ left: `${spanPercent(range.start, t, range).size}%` }}
          />
        ))}

        {/* Sesiones */}
        <ul className="absolute inset-0">
          {placed.map(({ event, lane, lanes }) => {
            const span = spanPercent(event.start as number, event.end ?? (event.start as number) + 60, range);
            const label = `${minutesLabel(event.start as number)} a ${minutesLabel(event.end ?? (event.start as number) + 60)}, ${event.title}${event.subtitle ? `, ${event.subtitle}` : ""}, ${event.statusLabel}`;
            const style = {
              left: `calc(${span.offset}% + 2px)`,
              width: `calc(${span.size}% - 4px)`,
              top: `calc(${(lane / lanes) * 100}% + 4px)`,
              height: `calc(${100 / lanes}% - 8px)`,
            };
            const inner = (
              <>
                {lanes === 1 && (
                  <span className="block truncate text-[12px] leading-tight text-gs-soft">
                    {minutesLabel(event.start as number)}
                  </span>
                )}
                <span className="block truncate text-[13px] font-semibold leading-tight text-gs-paper">
                  {event.title}
                </span>
              </>
            );
            const clip = cx(
              "flex h-full w-full flex-col justify-center overflow-hidden rounded-[4px] border-l-[3px] px-2",
              clipClass(event),
            );
            return (
              <li key={event.id} className="absolute" style={style}>
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
        </ul>

        {nowMinutes !== undefined && (
          <NowLine rangeStart={range.start} rangeEnd={range.end} initialMinutes={nowMinutes} />
        )}
      </div>

      {/* Regla de horas */}
      <div aria-hidden className="relative mt-1.5 h-4 text-[12px] leading-none text-gs-faint">
        {marks.map((t, i) => {
          const isFirst = i === 0;
          const isLast = i === marks.length - 1;
          return (
            <span
              key={t}
              className={cx(
                "absolute top-0",
                isFirst ? "" : isLast ? "-translate-x-full" : "-translate-x-1/2",
                dense && i % 2 === 1 && "max-sm:hidden",
              )}
              style={{ left: `${spanPercent(range.start, t, range).size}%` }}
            >
              {minutesLabel(t)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
