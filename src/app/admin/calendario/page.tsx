import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import BlockTimeButton from "@/components/admin/BlockTimeButton";
import DateJump from "@/components/admin/DateJump";
import AgendaList, { type AgendaItem } from "@/components/admin/agenda/AgendaList";
import DayTrack from "@/components/admin/agenda/DayTrack";
import MonthGrid from "@/components/admin/agenda/MonthGrid";
import WeekGrid from "@/components/admin/agenda/WeekGrid";
import {
  PACK_BLOCK_SELECT,
  amountDue,
  manualBlockToEvent,
  occupiesSlot,
  packBlocksToRows,
  reservationToEvent,
  withClienteStats,
  type ManualBlock,
  type PackBlockRow,
  type SessionRowData,
} from "@/components/admin/agenda/events";
import { EmptyState, LinkButton, Notice, Page, Panel, Segmented, buttonClass } from "@/components/admin/ui";
import { getReservations } from "@/app/actions/calendario";
import {
  addDays,
  addMonths,
  minutesLabel,
  monthGrid,
  openingMinutes,
  parseAgendaView,
  startOfMonth,
  weekDays,
  type AgendaEvent,
  type AgendaView,
} from "@/lib/agenda";
import { getAdminSession } from "@/lib/auth";
import { formatIsoDateEs, isValidIsoDate, nowMinutesInStudio, todayInStudio } from "@/lib/dates";
import { capitalizeFirst, formatEUR, plural } from "@/lib/format";
import { redirect } from "next/navigation";

type SearchParams = { [key: string]: string | string[] | undefined };

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const VIEW_LABEL: Record<AgendaView, string> = { mes: "Mes", semana: "Semana", dia: "Día" };

/** "23 – 29 de noviembre de 2026" o "30 nov – 6 dic 2026" si cruza de mes. */
function weekTitle(start: string, end: string): string {
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(8))} – ${formatIsoDateEs(end, { day: "numeric", month: "long", year: "numeric" })}`;
  }
  const short: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${formatIsoDateEs(start, short)} – ${formatIsoDateEs(end, { ...short, year: "numeric" })}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = parseAgendaView(first(params.view));

  const todayStr = todayInStudio();
  const fechaParam = first(params.fecha);
  const hasFecha = !!fechaParam && isValidIsoDate(fechaParam);

  // Compatibilidad con enlaces antiguos (?semana=N): desplazamiento en semanas.
  const rawOffset = Number.parseInt(first(params.semana) ?? "", 10);
  const weekOffset = Number.isFinite(rawOffset) ? Math.max(-520, Math.min(520, rawOffset)) : 0;
  const baseDate = addDays(hasFecha ? (fechaParam as string) : todayStr, weekOffset * 7);

  let days: string[];
  let weeks: string[][] = [];
  let title: string;
  let prevFecha: string;
  let nextFecha: string;
  /** Días que cuentan para el resumen (en la vista de mes, solo los del mes). */
  let summaryDays: string[];

  if (view === "dia") {
    days = [baseDate];
    summaryDays = days;
    title = formatIsoDateEs(baseDate);
    prevFecha = addDays(baseDate, -1);
    nextFecha = addDays(baseDate, 1);
  } else if (view === "mes") {
    weeks = monthGrid(baseDate);
    days = weeks.flat();
    summaryDays = days.filter((d) => d.slice(0, 7) === baseDate.slice(0, 7));
    title = formatIsoDateEs(baseDate, { month: "long", year: "numeric" });
    prevFecha = addMonths(startOfMonth(baseDate), -1);
    nextFecha = addMonths(startOfMonth(baseDate), 1);
  } else {
    days = weekDays(baseDate);
    summaryDays = days;
    title = weekTitle(days[0], days[6]);
    prevFecha = addDays(days[0], -7);
    nextFecha = addDays(days[0], 7);
  }

  const startDate = days[0];
  const endDate = days[days.length - 1];

  // La sesión se valida una vez por petición (también la usa getReservations).
  const { supabase, user } = await getAdminSession();
  if (!user) redirect("/admin/login");

  // Las tres consultas son independientes: en paralelo.
  const [reservasRes, bloquesRes, bloqueosRes] = await Promise.all([
    getReservations(startDate, endDate),
    supabase
      .from("reserva_bloque")
      .select(PACK_BLOCK_SELECT)
      .gte("fecha", startDate)
      .lte("fecha", endDate),
    supabase
      .from("bloqueo_horario")
      .select("id, motivo, fecha, hora_inicio, hora_fin")
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .is("deleted_at", null),
  ]);

  if (!reservasRes.ok) console.error("[calendario] Error leyendo reservas:", reservasRes.error);
  if (bloquesRes.error) console.error("[calendario] Error leyendo bloques de pack:", bloquesRes.error.message);
  if (bloqueosRes.error) console.error("[calendario] Error leyendo bloqueos:", bloqueosRes.error.message);

  const hasError = !reservasRes.ok || Boolean(bloquesRes.error) || Boolean(bloqueosRes.error);

  const reservas: SessionRowData[] = (reservasRes.ok ? reservasRes.data : []).map(withClienteStats);
  const bloqueosManuales = (bloqueosRes.data ?? []) as unknown as ManualBlock[];

  // Bloques de pack: heredan datos de la reserva padre (precio, contacto, pago).
  const packBlocks = packBlocksToRows((bloquesRes.data ?? []) as unknown as PackBlockRow[]);

  // Por día: filas para la lista (con acciones) y eventos para pistas y rejillas.
  const itemsByDay: Record<string, AgendaItem[]> = {};
  const eventsByDay: Record<string, AgendaEvent[]> = {};

  for (const r of [...reservas, ...packBlocks]) {
    (itemsByDay[r.fecha_reserva] ??= []).push({ kind: "reserva", time: r.hora_inicio, row: r });
    (eventsByDay[r.fecha_reserva] ??= []).push(reservationToEvent(r));
  }
  for (const b of bloqueosManuales) {
    (itemsByDay[b.fecha] ??= []).push({ kind: "bloqueo", time: b.hora_inicio, block: b });
    (eventsByDay[b.fecha] ??= []).push(manualBlockToEvent(b));
  }
  for (const key in itemsByDay) {
    itemsByDay[key].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }

  // Resumen del periodo (solo reservas reales, sin bloques de pack ni bloqueos).
  const inSummary = new Set(summaryDays);
  const periodReservas = reservas.filter((r) => inSummary.has(r.fecha_reserva));
  const sesiones = periodReservas.filter((r) => occupiesSlot(r.estado)).length;
  const porConfirmar = periodReservas.filter((r) => r.estado === "pendiente").length;
  const porCobrar = periodReservas
    .filter(
      (r) =>
        (r.estado === "confirmada" || r.estado === "completada") &&
        (r.estado_pago === "pendiente" || r.estado_pago === "parcial"),
    )
    .reduce((sum, r) => sum + amountDue(r), 0);

  const summaryParts = [plural(sesiones, "sesión", "sesiones")];
  if (porConfirmar > 0) summaryParts.push(`${porConfirmar} por confirmar`);
  if (porCobrar > 0) summaryParts.push(`${formatEUR(porCobrar)} por cobrar`);

  const hrefFor = (nextView: AgendaView, fecha?: string) =>
    `/admin/calendario?view=${nextView}${fecha ? `&fecha=${fecha}` : ""}`;
  const dayHref = (date: string) => hrefFor("dia", date);
  const keepFecha = hasFecha || weekOffset !== 0 ? baseDate : undefined;

  const step = view === "dia" ? "Día" : view === "mes" ? "Mes" : "Semana";
  const nowMinutes = nowMinutesInStudio();
  const opening = openingMinutes(baseDate);
  const listedCount = days.reduce((n, d) => n + (itemsByDay[d]?.length ?? 0), 0);

  return (
    <Page>
      <AdminNav
        title="Calendario"
        description={hasError ? undefined : summaryParts.join(", ")}
        actions={
          <>
            <BlockTimeButton initialDate={baseDate} />
            <LinkButton href={`/admin/calendario/nueva?fecha=${baseDate}`} variant="primary">
              <Plus aria-hidden /> Nueva reserva
            </LinkButton>
          </>
        }
      />

      {/* Navegación del periodo y vistas */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-1">
          <Link
            href={hrefFor(view, prevFecha)}
            aria-label={`${step} anterior`}
            className={buttonClass("secondary", "sm", "w-10 px-0 sm:w-8")}
          >
            <ChevronLeft aria-hidden />
          </Link>
          <Link href={hrefFor(view)} className={buttonClass("secondary", "sm")}>
            Hoy
          </Link>
          <Link
            href={hrefFor(view, nextFecha)}
            aria-label={`${step} siguiente`}
            className={buttonClass("secondary", "sm", "w-10 px-0 sm:w-8")}
          >
            <ChevronRight aria-hidden />
          </Link>
        </div>

        <h2 className="gs-display text-[18px] font-semibold leading-tight text-gs-paper">
          {capitalizeFirst(title)}
        </h2>

        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <DateJump currentFecha={baseDate} view={view} />
          <Segmented
            label="Vista del calendario"
            items={(["mes", "semana", "dia"] as const).map((v) => ({
              href: hrefFor(v, keepFecha),
              label: VIEW_LABEL[v],
              active: v === view,
            }))}
          />
        </div>
      </div>

      {hasError ? (
        <Notice title="No se pudo cargar el calendario">
          <p>
            Falló la consulta de reservas o bloqueos, así que no se muestra una agenda vacía que podría
            no ser cierta. Vuelve a intentarlo.
          </p>
          <p className="mt-3">
            <Link href={hrefFor(view, keepFecha)} className={buttonClass("secondary", "sm")}>
              Reintentar
            </Link>
          </p>
        </Notice>
      ) : (
        <div className="space-y-4">
          {view === "mes" && (
            <MonthGrid
              weeks={weeks}
              month={baseDate.slice(0, 7)}
              eventsByDay={eventsByDay}
              today={todayStr}
              dayHref={dayHref}
            />
          )}

          {view === "semana" && (
            <div className="hidden lg:block">
              <WeekGrid
                days={days}
                eventsByDay={eventsByDay}
                today={todayStr}
                nowMinutes={nowMinutes}
                dayHref={dayHref}
              />
            </div>
          )}

          {view === "dia" && (
            <Panel
              title="Pista del día"
              meta={
                opening
                  ? `Abierto de ${minutesLabel(opening.open)} a ${minutesLabel(opening.close)}`
                  : "Cerrado"
              }
            >
              <DayTrack
                date={baseDate}
                events={eventsByDay[baseDate] ?? []}
                nowMinutes={baseDate === todayStr ? nowMinutes : undefined}
              />
            </Panel>
          )}

          {view !== "mes" && (
            <Panel
              flush
              title={view === "dia" ? "Agenda del día" : "Agenda de la semana"}
            >
              {listedCount === 0 ? (
                <EmptyState
                  title={view === "dia" ? "No hay nada programado este día" : "No hay nada programado esta semana"}
                  hint="Las reservas de la web aparecen aquí en cuanto entran. Para apuntar una a mano, usa Nueva reserva."
                />
              ) : (
                <AgendaList
                  days={days}
                  itemsByDay={itemsByDay}
                  eventsByDay={eventsByDay}
                  today={todayStr}
                  dayHref={dayHref}
                  showDayHeaders={view !== "dia"}
                />
              )}
            </Panel>
          )}

          <Legend />
        </div>
      )}
    </Page>
  );
}

/** Qué significa cada marca de las pistas y rejillas. */
function Legend() {
  const dot = "inline-block size-2 rounded-full";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-gs-soft" aria-label="Leyenda">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className={`${dot} bg-gs-amber`} /> Pendiente de confirmar
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className={`${dot} bg-gs-ok`} /> Confirmada
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className={`${dot} bg-gs-info`} /> Completada
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="gs-hatch inline-block h-2 w-4 rounded-[2px] border border-gs-line-strong" /> Bloqueado
        o fuera de horario
      </li>
    </ul>
  );
}
