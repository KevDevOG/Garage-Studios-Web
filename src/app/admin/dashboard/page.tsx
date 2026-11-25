import Link from "next/link";
import { redirect } from "next/navigation";
import ContactStatusButton from "@/components/ContactStatusButton";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminNav from "@/components/admin/AdminNav";
import CalendarReservationCard from "@/components/admin/CalendarReservationCard";
import DashboardQuickActions from "@/components/admin/DashboardQuickActions";
import DashboardSummary from "@/components/admin/DashboardSummary";
import StatusBadge from "@/components/admin/StatusBadge";
import TodayAtGarage from "@/components/admin/TodayAtGarage";
import UpcomingAppointments from "@/components/admin/UpcomingAppointments";
import {
  PACK_BLOCK_SELECT,
  SESSION_SELECT,
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
import { Badge, EmptyState, LinkButton, Notice, Page, Panel, textLink } from "@/components/admin/ui";
import { getMonthlyRevenueResult } from "@/app/actions/finanzas";
import { getAdminSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeEs, formatIsoDateEs, nowMinutesInStudio, todayInStudio } from "@/lib/dates";
import { capitalizeFirst, formatEUR, plural } from "@/lib/format";

interface PendingPaymentRow {
  id: string;
  nombre: string;
  fecha_reserva: string;
  precio: number | null;
  importe_pagado: number | null;
  estado_pago: string;
  servicio: { nombre: string } | null;
}

interface ContactRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  asunto: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

const SHORT_DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
const MESSAGE_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
const MAX_PENDING_PAYMENTS = 6;

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const todayStr = todayInStudio();

  // Una sola ronda en paralelo: la validación de sesión (deduplicada por
  // petición; la comparte getMonthlyRevenueResult) y todas las lecturas.
  // Las lecturas van con la sesión de las cookies y las protege RLS; nada se
  // pinta si la validación de más abajo falla.
  const [
    session,
    hoyRes,
    bloquesHoyRes,
    bloqueosHoyRes,
    proximasRes,
    pendientesRes,
    porCobrarRes,
    revenueRes,
    emailErrorsRes,
    unreadRes,
    contactosRes,
  ] = await Promise.all([
    getAdminSession(),
    // Reservas de hoy
    supabase
      .from("reserva")
      .select(SESSION_SELECT)
      .eq("fecha_reserva", todayStr)
      .is("deleted_at", null)
      .order("hora_inicio", { ascending: true }),
    // Sesiones de pack de hoy
    supabase.from("reserva_bloque").select(PACK_BLOCK_SELECT).eq("fecha", todayStr),
    // Horas bloqueadas de hoy
    supabase
      .from("bloqueo_horario")
      .select("id, motivo, fecha, hora_inicio, hora_fin")
      .eq("fecha", todayStr)
      .is("deleted_at", null),
    // Próximas sesiones que siguen en pie
    supabase
      .from("reserva")
      .select(SESSION_SELECT)
      .gt("fecha_reserva", todayStr)
      .in("estado", ["pendiente", "confirmada"])
      .is("deleted_at", null)
      .order("fecha_reserva", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(8),
    // Reservas por confirmar (las más antiguas primero)
    supabase
      .from("reserva")
      .select(SESSION_SELECT, { count: "exact" })
      .eq("estado", "pendiente")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(30),
    // Cobros pendientes: mismo criterio que Finanzas (confirmadas o completadas sin cobrar del todo)
    supabase
      .from("reserva")
      .select("id, nombre, fecha_reserva, precio, importe_pagado, estado_pago, servicio(nombre)")
      .in("estado", ["confirmada", "completada"])
      .in("estado_pago", ["pendiente", "parcial"])
      .is("deleted_at", null)
      .order("fecha_reserva", { ascending: false }),
    // Ingresos reales del mes (misma lógica que Finanzas)
    getMonthlyRevenueResult(),
    // Correos que no se pudieron enviar
    supabase
      .from("reserva")
      .select("id", { count: "exact", head: true })
      .or("confirmacion_error.not.is.null,email_estado_error.not.is.null"),
    // Mensajes sin leer
    supabase.from("contacto").select("id", { count: "exact", head: true }).eq("leido", false),
    // Últimos mensajes
    supabase
      .from("contacto")
      .select("id, nombre, email, telefono, asunto, mensaje, leido, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!session.user) redirect("/admin/login");

  if (hoyRes.error) console.error("[dashboard] Error al obtener las reservas de hoy:", hoyRes.error.message);
  if (bloquesHoyRes.error) console.error("[dashboard] Error al obtener bloques de pack de hoy:", bloquesHoyRes.error.message);
  if (bloqueosHoyRes.error) console.error("[dashboard] Error al obtener bloqueos de hoy:", bloqueosHoyRes.error.message);
  if (proximasRes.error) console.error("[dashboard] Error al obtener próximas reservas:", proximasRes.error.message);
  if (pendientesRes.error) console.error("[dashboard] Error al obtener reservas pendientes:", pendientesRes.error.message);
  if (porCobrarRes.error) console.error("[dashboard] Error al obtener cobros pendientes:", porCobrarRes.error.message);
  if (!revenueRes.ok) console.error("[dashboard] Error al obtener ingresos del mes:", revenueRes.error);
  if (emailErrorsRes.error) console.error("[dashboard] Error al contar errores de correo:", emailErrorsRes.error.message);
  if (unreadRes.error) console.error("[dashboard] Error al contar mensajes sin leer:", unreadRes.error.message);
  if (contactosRes.error) console.error("[dashboard] Error al obtener mensajes:", contactosRes.error.message);

  // ── Hoy ──
  const todayFailed = Boolean(hoyRes.error || bloquesHoyRes.error || bloqueosHoyRes.error);
  const reservasHoy = ((hoyRes.data ?? []) as unknown as SessionRowData[]).map(withClienteStats);
  const packHoy = packBlocksToRows((bloquesHoyRes.data ?? []) as unknown as PackBlockRow[]);
  const bloqueosHoy = (bloqueosHoyRes.data ?? []) as unknown as ManualBlock[];
  const sesionesHoy = [...reservasHoy, ...packHoy].sort((a, b) =>
    (a.hora_inicio || "99:99").localeCompare(b.hora_inicio || "99:99"),
  );
  const eventosHoy = [...sesionesHoy.map(reservationToEvent), ...bloqueosHoy.map(manualBlockToEvent)];

  // ── Próximas y por confirmar ──
  const proximas = ((proximasRes.data ?? []) as unknown as SessionRowData[]).map(withClienteStats);
  const pendientesFailed = Boolean(pendientesRes.error || !pendientesRes.data);
  const pendientes = ((pendientesRes.data ?? []) as unknown as SessionRowData[]).map(withClienteStats);
  const pendingCount = pendientesRes.count ?? pendientes.length;

  // ── Cobros ──
  const porCobrar = (porCobrarRes.data ?? []) as unknown as PendingPaymentRow[];
  const totalPorCobrar = porCobrar.reduce((sum, r) => sum + amountDue(r), 0);

  // ── Mensajes ──
  const contactos = (contactosRes.data ?? []) as unknown as ContactRow[];
  const unreadCount = unreadRes.error ? null : (unreadRes.count ?? 0);
  const emailErrors = emailErrorsRes.count ?? 0;

  return (
    <Page>
      <AdminNav
        title="Panel"
        description={capitalizeFirst(formatIsoDateEs(todayStr))}
        actions={<DashboardQuickActions today={todayStr} />}
      />

      <div className="mb-4">
        <AdminGlobalSearch />
      </div>

      <DashboardSummary
        stats={{
          hoy: todayFailed ? null : sesionesHoy.filter((s) => occupiesSlot(s.estado)).length,
          porConfirmar: pendientesFailed ? null : pendingCount,
          cobros: porCobrarRes.error ? null : { count: porCobrar.length, total: totalPorCobrar },
          ingresosMes: revenueRes.ok ? revenueRes.data : null,
          mensajes: unreadCount,
        }}
      />

      {emailErrors > 0 && (
        <Notice tone="amber" title={`${plural(emailErrors, "reserva tiene", "reservas tienen")} un correo que no se pudo enviar`} className="mt-4">
          Abre cada reserva afectada para ver el error y avisa al cliente por otra vía. La{" "}
          <Link href="/admin/auditoria" className={textLink}>
            auditoría
          </Link>{" "}
          recoge los cambios de estado recientes.
        </Notice>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Agenda */}
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <TodayAtGarage
            today={todayStr}
            nowMinutes={nowMinutesInStudio()}
            sessions={sesionesHoy}
            events={eventosHoy}
            next={proximas[0]}
            failed={todayFailed}
          />

          <Panel flush title="Por confirmar" meta={pendientesFailed ? undefined : pendingCount}>
            {pendientesFailed ? (
              <div className="p-4">
                <Notice title="No se pudieron cargar las reservas por confirmar">
                  Recarga la página para reintentarlo.
                </Notice>
              </div>
            ) : pendientes.length === 0 ? (
              <EmptyState
                title="Todo al día"
                hint="No hay reservas esperando confirmación. Las nuevas de la web aparecerán aquí."
              />
            ) : (
              <>
                <ul className="divide-y divide-gs-line">
                  {pendientes.map((res) => (
                    <CalendarReservationCard key={res.id} reservation={res} showDate />
                  ))}
                </ul>
                {pendingCount > pendientes.length && (
                  <p className="border-t border-gs-line px-4 py-2.5 text-[12px] text-gs-faint">
                    Se muestran las {pendientes.length} más antiguas de {pendingCount}.
                  </p>
                )}
              </>
            )}
          </Panel>

          <UpcomingAppointments reservations={proximas} failed={Boolean(proximasRes.error)} />
        </div>

        {/* Cobros y mensajes */}
        <div className="min-w-0 space-y-4 lg:col-span-4">
          <Panel
            flush
            title="Cobros pendientes"
            meta={porCobrarRes.error || porCobrar.length === 0 ? undefined : formatEUR(totalPorCobrar)}
            action={
              <LinkButton href="/admin/finanzas" variant="ghost" size="sm">
                Ver finanzas
              </LinkButton>
            }
          >
            {porCobrarRes.error ? (
              <div className="p-4">
                <Notice title="No se pudieron cargar los cobros pendientes">
                  Recarga la página para reintentarlo.
                </Notice>
              </div>
            ) : porCobrar.length === 0 ? (
              <EmptyState title="No hay cobros pendientes" hint="Todas las sesiones confirmadas o completadas están cobradas." />
            ) : (
              <>
                <ul className="divide-y divide-gs-line">
                  {porCobrar.slice(0, MAX_PENDING_PAYMENTS).map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/admin/calendario/${r.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-gs-paper">{r.nombre}</span>
                          <span className="block truncate text-[12px] text-gs-faint">
                            {formatIsoDateEs(r.fecha_reserva, SHORT_DAY)}
                            {r.servicio?.nombre ? `, ${r.servicio.nombre}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[14px] font-semibold text-gs-paper">{formatEUR(amountDue(r))}</span>
                          <StatusBadge type="pago" value={r.estado_pago} plain />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {porCobrar.length > MAX_PENDING_PAYMENTS && (
                  <p className="border-t border-gs-line px-4 py-2.5 text-[12px] text-gs-faint">
                    Y {porCobrar.length - MAX_PENDING_PAYMENTS} más en{" "}
                    <Link href="/admin/finanzas" className={textLink}>
                      Finanzas
                    </Link>
                    .
                  </p>
                )}
              </>
            )}
          </Panel>

          <div id="mensajes" className="scroll-mt-20">
            <Panel
              flush
              title="Mensajes de la web"
              meta={unreadCount ? `${unreadCount} sin leer` : undefined}
            >
              {contactosRes.error ? (
                <div className="p-4">
                  <Notice title="No se pudieron cargar los mensajes">Recarga la página para reintentarlo.</Notice>
                </div>
              ) : contactos.length === 0 ? (
                <EmptyState
                  title="Aún no hay mensajes"
                  hint="Lo que escriban desde el formulario de contacto de la web llegará aquí."
                />
              ) : (
                <ul className="divide-y divide-gs-line">
                  {contactos.map((c) => (
                    <li key={c.id}>
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-2.5 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[14px] font-medium text-gs-paper">{c.nombre}</span>
                              {!c.leido && (
                                <Badge tone="amber" plain className="shrink-0">
                                  Nuevo
                                </Badge>
                              )}
                            </span>
                            <span className="block truncate text-[13px] text-gs-soft">{c.asunto}</span>
                          </span>
                          <span className="shrink-0 pt-0.5 text-[12px] text-gs-faint">
                            {formatDateTimeEs(c.created_at, MESSAGE_DATE)}
                          </span>
                        </summary>
                        <div className="space-y-3 px-4 pb-3">
                          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gs-paper">
                            {c.mensaje}
                          </p>
                          <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                            <a href={`mailto:${c.email}`} className={`${textLink} break-all`}>
                              {c.email}
                            </a>
                            {c.telefono && (
                              <a href={`tel:${c.telefono.replace(/\s+/g, "")}`} className={textLink}>
                                {c.telefono}
                              </a>
                            )}
                          </p>
                          <ContactStatusButton id={c.id} isRead={c.leido} />
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </Page>
  );
}
