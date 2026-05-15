import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getReservations } from "@/app/actions/calendario";
import CalendarReservationCard from "@/components/admin/CalendarReservationCard";
import { createClient } from "@/lib/supabase/server";
import DateJump from "@/components/admin/DateJump";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List } from "lucide-react";
import BlockTimeButton from "@/components/admin/BlockTimeButton";
import DeleteBloqueoButton from "@/components/admin/DeleteBloqueoButton";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; fecha?: string; view?: 'weekly' | 'daily' }>;
}) {
  const params = await searchParams;
  const view = params.view || 'weekly';

  // Fecha base: hoy o la que el usuario haya elegido
  const today = new Date();
  let baseDate = new Date(today);

  if (params.fecha) {
    const jumpDate = new Date(params.fecha + "T00:00:00");
    if (!isNaN(jumpDate.getTime())) {
      baseDate = jumpDate;
    }
  }

  // Offset de semanas relativo a la fecha base (solo para vista semanal)
  const offset = params.semana ? parseInt(params.semana, 10) : 0;

  // Rango de fechas
  let startDate: string;
  let endDate: string;
  let displayRange: string;

  const getLocalISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  if (view === 'daily') {
    startDate = getLocalISO(baseDate);
    endDate = startDate;
    displayRange = baseDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  } else {
    const monday = new Date(baseDate);
    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    monday.setDate(baseDate.getDate() - diffToMonday + (offset * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    startDate = getLocalISO(monday);
    endDate = getLocalISO(sunday);
    displayRange = `${formatDateLabel(startDate)} — ${formatDateLabel(endDate)}`;
  }

  const reservas = await getReservations(startDate, endDate);
  const supabase = await createClient();

  // Bloques vinculados a reservas
  const { data: bloques } = await supabase
    .from("reserva_bloque")
    .select("*, reserva(*, servicio(nombre), cliente:cliente_id(total_reservas))")
    .gte("fecha", startDate)
    .lte("fecha", endDate);

  // Bloqueos manuales
  const { data: bloqueosManuales } = await supabase
    .from("bloqueo_horario")
    .select("*")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  const mappedBlocks: any[] = (bloques || []).map((b) => ({
    id: b.id,
    nombre: b.reserva?.nombre || "Bloque de Tiempo",
    fecha_reserva: b.fecha,
    hora_inicio: b.hora_inicio,
    hora_fin: b.hora_fin,
    estado: b.estado,
    is_block: true,
    block_title: b.titulo,
    servicio: b.reserva?.servicio,
  }));

  const mappedManualBlocks: any[] = (bloqueosManuales || []).map((bm) => ({
    id: bm.id,
    nombre: bm.motivo || "Bloqueo Administrativo",
    fecha_reserva: bm.fecha,
    hora_inicio: bm.hora_inicio,
    hora_fin: bm.hora_fin,
    estado: 'bloqueado',
    is_manual_block: true,
  }));

  const allEvents = [...reservas, ...mappedBlocks, ...mappedManualBlocks];

  const grouped: Record<string, any[]> = {};
  for (const r of allEvents) {
    const key = r.fecha_reserva;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  for (const key in grouped) {
    grouped[key].sort((a, b) => (a.hora_inicio || "23:59").localeCompare(b.hora_inicio || "23:59"));
  }

  const todayStr = getLocalISO(today);
  const daysToShow = view === 'daily' ? [startDate] : [];
  if (view === 'weekly') {
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate + "T00:00:00");
      d.setDate(d.getDate() + i);
      daysToShow.push(getLocalISO(d));
    }
  }

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Calendario" />

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <DateJump currentFecha={params.fecha || todayStr} />
            <div className="flex items-center rounded-xl bg-card-bg border border-card-border p-1">
              <Link 
                href={`/admin/calendario?view=weekly${params.fecha ? `&fecha=${params.fecha}` : ''}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'weekly' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
              >
                <CalendarIcon className="h-4 w-4" /> Semanal
              </Link>
              <Link 
                href={`/admin/calendario?view=daily${params.fecha ? `&fecha=${params.fecha}` : ''}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'daily' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}
              >
                <List className="h-4 w-4" /> Diario
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/calendario?view=${view}${view === 'weekly' ? `&semana=${offset - 1}` : ''}${params.fecha ? `&fecha=${getLocalISO(new Date(new Date(startDate + "T00:00:00").setDate(new Date(startDate + "T00:00:00").getDate() - (view === 'daily' ? 1 : 0))))}` : ''}`}
              className="flex items-center rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Link>
            <span className="text-sm font-black uppercase tracking-widest text-white min-w-[200px] text-center">
              {displayRange}
            </span>
            <Link
              href={`/admin/calendario?view=${view}${view === 'weekly' ? `&semana=${offset + 1}` : ''}${params.fecha ? `&fecha=${getLocalISO(new Date(new Date(startDate + "T00:00:00").setDate(new Date(startDate + "T00:00:00").getDate() + (view === 'daily' ? 1 : 0))))}` : ''}`}
              className="flex items-center rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <BlockTimeButton />
          <Link
            href="/admin/calendario/nueva"
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover"
          >
            <Plus className="w-5 h-5" /> Nueva Reserva
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {daysToShow.map((dateStr) => {
          const events = grouped[dateStr] || [];
          const isToday = dateStr === todayStr;
          const d = new Date(dateStr + "T00:00:00");

          return (
            <div
              key={dateStr}
              className={`rounded-2xl border bg-card-bg p-4 sm:p-6 ${isToday ? "border-accent/50 shadow-lg shadow-accent/5" : "border-card-border"}`}
            >
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-black text-white">{dayNames[d.getDay()]}</span>
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
                  {events.map((ev) => (
                    ev.is_manual_block ? (
                      <div key={ev.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 group/block">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center min-w-[70px] py-1 px-2 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm">
                            {ev.hora_inicio?.slice(0, 5)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{ev.nombre}</div>
                            <div className="text-[10px] text-red-400/70 font-black uppercase tracking-widest">Bloqueo Manual</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] font-bold text-muted">{ev.hora_fin?.slice(0, 5)}</div>
                          <DeleteBloqueoButton id={ev.id} />
                        </div>
                      </div>
                    ) : (
                      <CalendarReservationCard key={ev.id} reservation={ev} />
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
