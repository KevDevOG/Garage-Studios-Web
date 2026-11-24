import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getReservations } from "@/app/actions/calendario";
import type { ReservationRow } from "@/app/actions/calendario";
import CalendarReservationCard from "@/components/admin/CalendarReservationCard";
import { createClient } from "@/lib/supabase/server";
import DateJump from "@/components/admin/DateJump";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, AlertCircle } from "lucide-react";
import BlockTimeButton from "@/components/admin/BlockTimeButton";
import DeleteBloqueoButton from "@/components/admin/DeleteBloqueoButton";
import { formatIsoDateEs, isValidIsoDate, todayInStudio, weekdayOfIsoDate } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";

type SearchParams = { [key: string]: string | string[] | undefined };

interface ManualBlock {
  id: string;
  nombre: string;
  fecha_reserva: string;
  hora_inicio: string | null;
  hora_fin: string | null;
}

type CalendarEvent =
  | { kind: "reserva"; fecha: string; hora: string | null; reservation: ReservationRow }
  | { kind: "manual"; fecha: string; hora: string | null; block: ManualBlock };

interface BlockRow {
  id: string;
  reserva_id: string;
  titulo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number | null;
  estado: string;
  reserva: {
    id: string;
    servicio_id: string | null;
    nombre: string | null;
    email: string | null;
    telefono: string | null;
    precio: number | null;
    estado_pago: ReservationRow["estado_pago"];
    importe_pagado: number | null;
    deleted_at: string | null;
    servicio: { nombre: string } | null;
    cliente: { total_reservas: number | null } | null;
  } | null;
}

interface ManualBlockRow {
  id: string;
  motivo: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
}

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view: "weekly" | "daily" = first(params.view) === "daily" ? "daily" : "weekly";

  const todayStr = todayInStudio();
  const fechaParam = first(params.fecha);
  const hasFecha = !!fechaParam && isValidIsoDate(fechaParam);
  const baseDate = hasFecha ? (fechaParam as string) : todayStr;

  // Compatibilidad con enlaces antiguos (?semana=N). Los enlaces actuales
  // navegan siempre con una fecha concreta, sin desplazamiento acumulado.
  const rawOffset = Number.parseInt(first(params.semana) ?? "", 10);
  const weekOffset = Number.isFinite(rawOffset) ? Math.max(-520, Math.min(520, rawOffset)) : 0;

  let startDate: string;
  let endDate: string;
  let displayRange: string;
  let prevFecha: string;
  let nextFecha: string;

  const formatDateLabel = (iso: string) => formatIsoDateEs(iso, { day: "numeric", month: "short" });

  if (view === "daily") {
    startDate = baseDate;
    endDate = baseDate;
    displayRange = formatIsoDateEs(baseDate, { day: "numeric", month: "long", year: "numeric" });
    prevFecha = addDays(baseDate, -1);
    nextFecha = addDays(baseDate, 1);
  } else {
    const weekday = weekdayOfIsoDate(baseDate);
    const diffToMonday = weekday === 0 ? 6 : weekday - 1;
    startDate = addDays(baseDate, -diffToMonday + weekOffset * 7);
    endDate = addDays(startDate, 6);
    displayRange = `${formatDateLabel(startDate)} — ${formatDateLabel(endDate)}`;
    prevFecha = addDays(startDate, -7);
    nextFecha = addDays(startDate, 7);
  }

  const supabase = await createClient();

  // Las tres consultas son independientes: en paralelo.
  const [reservasRes, bloquesRes, bloqueosRes] = await Promise.all([
    getReservations(startDate, endDate),
    supabase
      .from("reserva_bloque")
      .select(
        "id, reserva_id, titulo, fecha, hora_inicio, hora_fin, duracion_minutos, estado, reserva:reserva_id(id, servicio_id, nombre, email, telefono, precio, estado_pago, importe_pagado, deleted_at, servicio(nombre), cliente:cliente_id(total_reservas))"
      )
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

  const reservas = reservasRes.ok ? reservasRes.data : [];
  const bloques = (bloquesRes.data ?? []) as unknown as BlockRow[];
  const bloqueosManuales = (bloqueosRes.data ?? []) as unknown as ManualBlockRow[];

  // Bloques de pack: heredan datos de la reserva padre (precio, contacto, pago).
  const packBlocks: ReservationRow[] = bloques
    .filter((b) => b.reserva && !b.reserva.deleted_at)
    .map((b) => {
      const parent = b.reserva!;
      return {
        id: b.id,
        servicio_id: parent.servicio_id ?? "",
        nombre: parent.nombre || "Bloque de Tiempo",
        email: parent.email ?? "",
        telefono: parent.telefono ?? "",
        fecha_reserva: b.fecha,
        hora_inicio: b.hora_inicio,
        hora_fin: b.hora_fin,
        duracion_minutos: b.duracion_minutos,
        observaciones: null,
        notas_admin: null,
        estado: b.estado,
        origen: null,
        created_at: "",
        updated_at: null,
        deleted_at: null,
        calendar_event_id: null,
        precio: parent.precio ?? null,
        cliente_total_reservas: parent.cliente?.total_reservas ?? undefined,
        servicio: parent.servicio,
        estado_pago: parent.estado_pago,
        importe_pagado: parent.importe_pagado ?? undefined,
        is_block: true,
        block_title: b.titulo,
        parent_reserva_id: b.reserva_id,
      };
    });

  const allEvents: CalendarEvent[] = [
    ...[...reservas, ...packBlocks].map((r): CalendarEvent => ({
      kind: "reserva",
      fecha: r.fecha_reserva,
      hora: r.hora_inicio,
      reservation: r,
    })),
    ...bloqueosManuales.map((bm): CalendarEvent => ({
      kind: "manual",
      fecha: bm.fecha,
      hora: bm.hora_inicio,
      block: {
        id: bm.id,
        nombre: bm.motivo || "Bloqueo Administrativo",
        fecha_reserva: bm.fecha,
        hora_inicio: bm.hora_inicio,
        hora_fin: bm.hora_fin,
      },
    })),
  ];

  const grouped: Record<string, CalendarEvent[]> = {};
  for (const ev of allEvents) {
    (grouped[ev.fecha] ??= []).push(ev);
  }
  for (const key in grouped) {
    grouped[key].sort((a, b) => (a.hora || "23:59").localeCompare(b.hora || "23:59"));
  }

  const daysToShow: string[] =
    view === "daily" ? [startDate] : Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const hrefFor = (nextView: "weekly" | "daily", fecha?: string) =>
    `/admin/calendario?view=${nextView}${fecha ? `&fecha=${fecha}` : ""}`;

  const arrowClass =
    "flex items-center rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white";

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Calendario" />

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <DateJump currentFecha={hasFecha ? baseDate : todayStr} view={view} />
            <div className="flex items-center rounded-xl bg-card-bg border border-card-border p-1">
              <Link
                href={hrefFor("weekly", hasFecha ? baseDate : undefined)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "weekly" ? "bg-accent text-black" : "text-muted hover:text-white"}`}
              >
                <CalendarIcon className="h-4 w-4" aria-hidden="true" /> Semanal
              </Link>
              <Link
                href={hrefFor("daily", hasFecha ? baseDate : undefined)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === "daily" ? "bg-accent text-black" : "text-muted hover:text-white"}`}
              >
                <List className="h-4 w-4" aria-hidden="true" /> Diario
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={hrefFor(view, prevFecha)}
              aria-label={view === "daily" ? "Día anterior" : "Semana anterior"}
              className={arrowClass}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <span className="min-w-0 text-center text-sm font-black uppercase tracking-widest text-white sm:min-w-[200px]">
              {displayRange}
            </span>
            <Link
              href={hrefFor(view, nextFecha)}
              aria-label={view === "daily" ? "Día siguiente" : "Semana siguiente"}
              className={arrowClass}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <BlockTimeButton />
          <Link
            href="/admin/calendario/nueva"
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover"
          >
            <Plus className="w-5 h-5" aria-hidden="true" /> Nueva Reserva
          </Link>
        </div>
      </div>

      {hasError ? (
        <div className="rounded-2xl border border-red-500/20 bg-card-bg p-8 text-center shadow-lg sm:p-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">
            No se pudo cargar el calendario
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Ocurrió un error al consultar las reservas o bloqueos del estudio. Por favor, recarga la página o inténtalo de nuevo más tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {daysToShow.map((dateStr) => {
            const events = grouped[dateStr] || [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`rounded-2xl border bg-card-bg p-4 sm:p-6 ${isToday ? "border-accent/50 shadow-lg shadow-accent/5" : "border-card-border"}`}
              >
                <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-black text-white">{DAY_NAMES[weekdayOfIsoDate(dateStr)]}</span>
                    <span className={`text-sm font-bold ${isToday ? "text-accent" : "text-muted"}`}>
                      {formatDateLabel(dateStr)} {isToday && " — HOY"}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                    {events.length} Eventos
                  </span>
                </div>

                {events.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted italic">No hay actividad programada para este día.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((ev) =>
                      ev.kind === "manual" ? (
                        <div key={ev.block.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 group/block">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm">
                              {formatTime(ev.block.hora_inicio)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-sm break-words">{ev.block.nombre}</div>
                              <div className="text-[10px] text-red-400/70 font-black uppercase tracking-widest">Bloqueo Manual</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-[10px] font-bold text-muted">{formatTime(ev.block.hora_fin)}</div>
                            <DeleteBloqueoButton id={ev.block.id} />
                          </div>
                        </div>
                      ) : (
                        <CalendarReservationCard key={ev.reservation.id} reservation={ev.reservation} />
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
