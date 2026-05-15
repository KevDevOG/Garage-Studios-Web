import { createClient } from "@/lib/supabase/server";
import ReservationStatusSelect from "@/components/ReservationStatusSelect";
import ContactStatusButton from "@/components/ContactStatusButton";
import AdminNav from "@/components/admin/AdminNav";
import DeleteReservationButton from "@/components/admin/DeleteReservationButton";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import TodayAtGarage from "@/components/admin/TodayAtGarage";
import UpcomingAppointments from "@/components/admin/UpcomingAppointments";
import DashboardQuickActions from "@/components/admin/DashboardQuickActions";
import DashboardSummary from "@/components/admin/DashboardSummary";
import StatusBadge from "@/components/admin/StatusBadge";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  
  // Reservas de hoy
  const { data: hoyReservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .eq("fecha_reserva", todayStr)
    .is("deleted_at", null)
    .order("hora_inicio", { ascending: true });

  // Próximas reservas
  const { data: proximasReservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .gt("fecha_reserva", todayStr)
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .limit(10);

  // Errores de email
  const { count: emailErrorsCount } = await supabase
    .from("reserva")
    .select("*", { count: 'exact', head: true })
    .or("confirmacion_error.not.is.null,email_estado_error.not.is.null");

  // Mensajes sin leer
  const { count: unreadCount } = await supabase
    .from("contacto")
    .select("*", { count: 'exact', head: true })
    .eq("leido", false);

  // Reservas con pagos pendientes
  const { getPendingPaymentReservations, getMonthlyRevenue } = await import("@/app/actions/finanzas");
  const pendingPaymentReservations = await getPendingPaymentReservations();
  
  // Ingresos del mes (usando la nueva lógica de ingresos reales)
  const currentMonthRevenue = await getMonthlyRevenue();

  // Últimas 30 reservas para los bloques de estado
  const { data: reservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre), cliente:cliente_id(total_reservas)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  const groups = {
    pendiente: reservas?.filter((r) => r.estado === "pendiente") || [],
    confirmada: reservas?.filter((r) => r.estado === "confirmada") || [],
  };

  const { data: contactos } = await supabase
    .from("contacto")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = {
    hoy: hoyReservas?.length || 0,
    mensajes: unreadCount || 0,
    pendientesPago: pendingPaymentReservations.length,
    ingresosMes: currentMonthRevenue,
    emailErrors: emailErrorsCount || 0,
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
      <AdminNav title="Dashboard" />

      {/* 1. Buscador Global */}
      <AdminGlobalSearch />

      {/* 2. Accesos Rápidos */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-white/5 pb-2">Acciones Rápidas</h2>
        <DashboardQuickActions />
      </div>

      {/* 3. Resumen Diario */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-white/5 pb-2">Estado del Día</h2>
        <DashboardSummary stats={stats} />
      </div>

      {/* 4. Hoy en Garage */}
      <TodayAtGarage reservations={hoyReservas || []} />

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Columna Izquierda: Reservas y Mensajes */}
        <div className="lg:col-span-2 space-y-12">
          {/* Próximas Citas */}
          <UpcomingAppointments reservations={proximasReservas || []} />

          {/* Reservas Pendientes de Revisión */}
          <div className="bg-card-bg border border-amber-400/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-amber-400/5 p-6 border-b border-amber-400/10 flex justify-between items-center">
              <h3 className="text-lg font-black text-amber-400 uppercase tracking-tighter">Pendientes de Revisar</h3>
              <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full">{groups.pendiente.length}</span>
            </div>
            
            <div className="p-4 sm:p-6">
              {groups.pendiente.length === 0 ? (
                <p className="text-sm text-muted italic">Todo al día. No hay reservas pendientes.</p>
              ) : (
                <div className="space-y-4">
                  {groups.pendiente.map((res) => (
                    <div key={res.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-accent uppercase tracking-tighter">
                            {new Date(res.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[10px] font-bold text-muted uppercase">
                            {res.hora_inicio?.slice(0, 5)}
                          </span>
                        </div>
                        <h4 className="font-black text-white truncate uppercase tracking-tighter">{res.nombre}</h4>
                        <p className="text-[10px] text-muted truncate uppercase tracking-widest">{res.servicio?.nombre}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ReservationStatusSelect id={res.id} currentStatus={res.estado} />
                        <DeleteReservationButton id={res.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Mensajes */}
        <div className="space-y-6">
          <div className="bg-card-bg border border-white/5 rounded-2xl p-6 shadow-xl h-fit">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Últimos Mensajes</h3>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{stats.mensajes} sin leer</span>
            </div>

            {contactos?.length === 0 ? (
              <p className="text-xs text-muted italic">No hay mensajes recientes.</p>
            ) : (
              <div className="space-y-4">
                {contactos?.map((c) => (
                  <div key={c.id} className={`p-3 rounded-xl border ${!c.leido ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5 bg-black/20'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-muted uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                      {!c.leido && <StatusBadge type="mensaje" value="nuevo" />}
                    </div>
                    <div className="font-bold text-sm text-white truncate mb-1">{c.nombre}</div>
                    <p className="text-[11px] text-white/60 line-clamp-2 italic mb-3">&ldquo;{c.asunto}&rdquo;</p>
                    <div className="flex justify-end">
                      <ContactStatusButton id={c.id} isRead={c.leido} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
