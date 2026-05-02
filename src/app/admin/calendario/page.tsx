import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getReservations } from "@/app/actions/calendario";
import CalendarReservationCard from "@/components/admin/CalendarReservationCard";
import { createClient } from "@/lib/supabase/server";
import DateJump from "@/components/admin/DateJump";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; fecha?: string }>;
}) {
  const params = await searchParams;

  // Fecha base: hoy o la que el usuario haya elegido
  const today = new Date();
  let baseDate = new Date(today);

  if (params.fecha) {
    const jumpDate = new Date(params.fecha + "T00:00:00");
    if (!isNaN(jumpDate.getTime())) {
      baseDate = jumpDate;
    }
  }

  // Offset de semanas relativo a la fecha base
  const offset = params.semana ? parseInt(params.semana, 10) : 0;

  // Calcular el lunes de la semana de la fecha base
  const monday = new Date(baseDate);
  const day = baseDate.getDay(); // 0=Dom, 1=Lun...
  const diffToMonday = day === 0 ? 6 : day - 1;
  monday.setDate(baseDate.getDate() - diffToMonday + (offset * 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startDate = monday.toISOString().split("T")[0];
  const endDate = sunday.toISOString().split("T")[0];
  const fechaParam = params.fecha ? `&fecha=${params.fecha}` : "";

  const reservas = await getReservations(startDate, endDate);

  // Obtener los bloques en el mismo rango de fechas
  const supabase = await createClient();
  const { data: bloques } = await supabase
    .from("reserva_bloque")
    .select("*, reserva(*, servicio(nombre))")
    .gte("fecha", startDate)
    .lte("fecha", endDate);

  // ... (mapping logic remains the same)
  const mappedBlocks: typeof reservas = (bloques || []).map((b) => ({
    id: b.id,
    servicio_id: b.reserva?.servicio_id || "",
    nombre: b.reserva?.nombre || "Desconocido",
    email: b.reserva?.email || "",
    telefono: b.reserva?.telefono || "",
    fecha_reserva: b.fecha,
    hora_inicio: b.hora_inicio,
    hora_fin: b.hora_fin,
    duracion_minutos: b.duracion_minutos,
    observaciones: b.reserva?.observaciones || null,
    notas_admin: b.reserva?.notas_admin || null,
    estado: b.estado,
    origen: b.reserva?.origen || "web",
    created_at: b.created_at,
    updated_at: b.updated_at,
    deleted_at: null,
    calendar_event_id: b.reserva?.calendar_event_id || null,
    servicio: b.reserva?.servicio,
    is_block: true,
    block_title: b.titulo,
    parent_reserva_id: b.reserva_id,
  }));

  const allEvents = [...reservas, ...mappedBlocks];

  // Agrupar por fecha
  const grouped: Record<string, typeof allEvents> = {};
  for (const r of allEvents) {
    const key = r.fecha_reserva;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  // Ordenar dentro de cada día
  for (const key in grouped) {
    grouped[key].sort((a, b) => {
      const timeA = a.hora_inicio || "23:59";
      const timeB = b.hora_inicio || "23:59";
      return timeA.localeCompare(timeB);
    });
  }

  // Generar todas las fechas de la semana (incluso las vacías)
  const weekDays: string[] = [];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d.toISOString().split("T")[0]);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Calendario" />

      {/* Controles */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <DateJump currentFecha={params.fecha || today.toISOString().split("T")[0]} />

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/calendario?semana=${offset - 1}${fechaParam}`}
              className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
            >
              ← Anterior
            </Link>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
            <Link
              href={`/admin/calendario?semana=${offset + 1}${fechaParam}`}
              className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
            >
              Siguiente →
            </Link>
            {(offset !== 0 || params.fecha) && (
              <Link
                href="/admin/calendario"
                className="text-xs font-medium text-accent hover:underline ml-2"
              >
                Volver a Hoy
              </Link>
            )}
          </div>
        </div>

        <Link
          href="/admin/calendario/nueva"
          className="rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover hover:scale-105"
        >
          + Nueva Reserva
        </Link>
      </div>

      {/* Vista semanal */}
      <div className="space-y-6">
        {weekDays.map((dateStr, idx) => {
          const dayReservations = grouped[dateStr] || [];
          const isToday = dateStr === today.toISOString().split("T")[0];

          return (
            <div
              key={dateStr}
              className={`rounded-xl border bg-card-bg p-4 sm:p-6 ${isToday
                ? "border-accent/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                : "border-card-border"
                }`}
            >
              <div className="mb-4 flex items-baseline gap-3 border-b border-card-border pb-3">
                <span className="text-lg font-bold">{dayNames[idx]}</span>
                <span className={`text-sm ${isToday ? "font-semibold text-accent" : "text-muted"}`}>
                  {formatDate(dateStr)}
                  {isToday && " — Hoy"}
                </span>
                <span className="ml-auto text-xs text-muted">
                  {dayReservations.length} reserva{dayReservations.length !== 1 ? "s" : ""}
                </span>
              </div>

              {dayReservations.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  Sin reservas
                </p>
              ) : (
                <div className="space-y-3">
                  {dayReservations.map((res) => (
                    <CalendarReservationCard key={res.id} reservation={res} />
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
