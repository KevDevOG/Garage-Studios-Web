import { createClient } from "@/lib/supabase/server";
import ReservationStatusSelect from "@/components/ReservationStatusSelect";
import ContactStatusButton from "@/components/ContactStatusButton";
import AdminNav from "@/components/admin/AdminNav";
import DeleteReservationButton from "@/components/admin/DeleteReservationButton";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  // Obtenemos la información del usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtenemos las últimas 50 reservas para tener una buena panorámica, ordenadas por fecha de solicitud
  const { data: reservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre), cliente:cliente_id(total_reservas)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // Agrupamos por estado
  const groups = {
    pendiente: reservas?.filter((r) => r.estado === "pendiente") || [],
    confirmada: reservas?.filter((r) => r.estado === "confirmada") || [],
    completada: reservas?.filter((r) => r.estado === "completada") || [],
    cancelada: reservas?.filter((r) => r.estado === "cancelada") || [],
    rechazada: reservas?.filter((r) => r.estado === "rechazada") || [],
  };

  const statusConfig = {
    pendiente: { title: "Reservas Pendientes de Revisar", color: "text-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/30" },
    confirmada: { title: "Reservas Confirmadas", color: "text-green-400", bg: "bg-green-400/5", border: "border-green-400/20" },
    completada: { title: "Historial: Completadas", color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
    cancelada: { title: "Canceladas", color: "text-red-400", bg: "bg-red-400/5", border: "border-red-400/20" },
    rechazada: { title: "Rechazadas", color: "text-red-300", bg: "bg-white/5", border: "border-white/10" },
  };

  // Obtenemos los últimos 10 mensajes de contacto, ordenados por fecha de creación
  const { data: contactos } = await supabase
    .from("contacto")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Dashboard" />

      {/* Info del usuario logueado */}
      <div className="mb-8 flex items-center justify-between rounded-xl border border-card-border bg-card-bg p-6">
        <div>
          <h2 className="font-medium text-accent italic">Panel de Control</h2>
          <p className="mt-1 text-sm text-muted">
            Sesión activa: <span className="text-foreground">{user?.email}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{groups.pendiente.length}</div>
          <div className="text-[10px] uppercase tracking-tighter text-amber-400 font-bold">Pendientes</div>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Sección de Reservas por Estado */}
        <div className="space-y-6">
          {(Object.entries(groups) as [keyof typeof groups, any[]][]).map(([status, items]) => {
            if (items.length === 0 && status !== "pendiente") return null;
            const config = statusConfig[status];

            return (
              <div
                key={status}
                className={`rounded-xl border ${config.border} ${config.bg} p-6 transition-all`}
              >
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className={`text-lg font-bold ${config.color}`}>
                    {config.title}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.color} bg-white/5`}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-muted italic py-2">No hay reservas en este estado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted/50 border-b border-white/5">
                          <th className="pb-3 font-medium">Información de la Cita</th>
                          <th className="pb-3 font-medium">Cliente</th>
                          <th className="pb-3 font-medium">Servicio</th>
                          <th className="pb-3 font-medium">Contacto</th>
                          <th className="pb-3 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((res) => (
                          <tr key={res.id} className="group transition-colors hover:bg-white/[0.02]">
                            <td className="whitespace-nowrap py-5 pr-6">
                              <div className="mb-2">
                                <div className="text-[10px] font-bold uppercase tracking-tighter text-muted">Solicitada el</div>
                                <div className="text-xs text-foreground/80">
                                  {new Date(res.created_at).toLocaleString("es-ES", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-tighter text-accent">Reserva para</div>
                                <div className="font-bold text-white">
                                  {new Date(res.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: 'long' })}
                                </div>
                                <div className="text-sm font-black text-accent">
                                  {res.hora_inicio?.slice(0, 5)} — {res.hora_fin?.slice(0, 5)}
                                </div>
                              </div>
                            </td>
                            <td className="py-5 pr-4">
                              <div className="font-semibold text-white">{res.nombre}</div>
                              {res.cliente?.total_reservas > 1 && (
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20">
                                  RECURRENTE
                                </span>
                              )}
                              {res.origen === "manual" && (
                                <span className="ml-1 text-[10px] text-accent font-bold uppercase tracking-tighter">Manual</span>
                              )}
                            </td>
                            <td className="py-5 pr-4">
                              <div className="text-sm font-medium text-white/90">
                                {res.servicio?.nombre || "N/A"}
                              </div>
                              <div className="text-[10px] text-muted">
                                {res.duracion_minutos || "--"} min
                              </div>
                            </td>
                            <td className="py-5 pr-4 text-xs text-muted">
                              <div className="text-foreground/80 font-medium">{res.email}</div>
                              <div>{res.telefono}</div>
                            </td>
                            <td className="py-5">
                              <div className="flex items-center gap-2">
                                <ReservationStatusSelect id={res.id} currentStatus={res.estado} />
                                <DeleteReservationButton id={res.id} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bloque de Contactos */}
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h3 className="mb-4 border-b border-card-border pb-4 text-lg font-semibold">
            Mensajes Recientes
          </h3>

          {!contactos || contactos.length === 0 ? (
            <p className="text-sm text-muted">No hay mensajes recientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Remitente</th>
                    <th className="pb-3 font-medium">Asunto</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {contactos.map((contacto) => (
                    <tr
                      key={contacto.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap py-3 pr-4">
                        {new Date(contacto.created_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{contacto.nombre}</div>
                        <div className="text-xs text-muted">{contacto.email}</div>
                      </td>
                      <td className="py-3 pr-4">{contacto.asunto}</td>
                      <td className="py-3">
                        <ContactStatusButton
                          id={contacto.id}
                          isRead={contacto.leido}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
