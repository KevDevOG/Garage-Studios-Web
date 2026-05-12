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

      {/* Info del usuario logueado - Resumen en tarjetas */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-card-border bg-card-bg p-3 sm:p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted font-black">Sesión</div>
          <div className="mt-1 text-xs sm:text-sm text-white font-bold truncate">{user?.email?.split('@')[0]}</div>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 sm:p-4 flex flex-col justify-between hover:bg-amber-400/10 transition-all">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-400 font-black">Pendientes</div>
          <div className="text-xl sm:text-2xl font-black text-white leading-none">{groups.pendiente.length}</div>
        </div>
        <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-3 sm:p-4 flex flex-col justify-between hover:bg-green-400/10 transition-all">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-green-400 font-black">Confirmadas</div>
          <div className="text-xl sm:text-2xl font-black text-white leading-none">{groups.confirmada.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-3 sm:p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted font-black">Total (50)</div>
          <div className="text-xl sm:text-2xl font-black text-white leading-none">{reservas?.length || 0}</div>
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
                className={`rounded-xl border ${config.border} ${config.bg} p-4 sm:p-6 transition-all`}
              >
                <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className={`text-lg font-bold ${config.color}`}>
                    {config.title}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.color} bg-white/5`}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-muted italic py-2 px-2">No hay reservas en este estado.</p>
                ) : (
                  <>
                    {/* Vista para MÓVIL (Tarjetas) */}
                    <div className="grid gap-4 md:hidden">
                      {items.map((res) => (
                        <div 
                          key={res.id} 
                          className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Cliente</div>
                              <div className="text-lg font-black text-white leading-tight">{res.nombre}</div>
                              {res.cliente?.total_reservas > 1 && (
                                <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20">
                                  RECURRENTE
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${config.color} bg-white/5 border ${config.border}`}>
                                {status}
                              </div>
                              {res.origen === "manual" && (
                                <div className="mt-1 text-[9px] text-accent font-bold uppercase tracking-tighter">Manual</div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-tighter text-accent mb-0.5">Reserva para</div>
                              <div className="font-bold text-white text-sm">
                                {new Date(res.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
                              </div>
                              <div className="text-base font-black text-accent">
                                {res.hora_inicio?.slice(0, 5)} — {res.hora_fin?.slice(0, 5)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-tighter text-muted mb-0.5">Servicio</div>
                              <div className="text-sm font-bold text-white/90 truncate">
                                {res.servicio?.nombre || "N/A"}
                              </div>
                              <div className="text-[10px] text-muted">
                                {res.duracion_minutos || "--"} min
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-2 text-white/80 font-medium truncate">
                              <span className="text-muted">Tel:</span> {res.telefono}
                            </div>
                            <div className="flex items-center gap-2 text-muted truncate">
                              <span>Email:</span> {res.email}
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <ReservationStatusSelect id={res.id} currentStatus={res.estado} />
                            </div>
                            <DeleteReservationButton id={res.id} />
                          </div>

                          <div className="pt-2 text-[9px] text-muted/50 uppercase tracking-widest text-right">
                            Solicitada: {new Date(res.created_at).toLocaleString("es-ES", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Vista para ESCRITORIO (Tabla) */}
                    <div className="hidden md:block overflow-x-auto">
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
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Bloque de Contactos */}
        <div className="rounded-xl border border-card-border bg-card-bg p-4 sm:p-6">
          <h3 className="mb-6 border-b border-card-border pb-4 text-lg font-semibold">
            Mensajes Recientes
          </h3>

          {!contactos || contactos.length === 0 ? (
            <p className="text-sm text-muted">No hay mensajes recientes.</p>
          ) : (
            <>
              {/* Vista para MÓVIL (Tarjetas) */}
              <div className="grid gap-4 md:hidden">
                {contactos.map((contacto) => (
                  <div 
                    key={contacto.id} 
                    className={`rounded-xl border ${!contacto.leido ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5 bg-black/20'} p-4 space-y-3`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            {new Date(contacto.created_at).toLocaleDateString("es-ES")}
                          </span>
                          {!contacto.leido && (
                            <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black uppercase text-black">
                              Nuevo
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white text-base truncate">{contacto.nombre}</div>
                        <div className="text-xs text-muted truncate">{contacto.email}</div>
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Asunto</div>
                      <div className="text-sm text-white/90 font-medium leading-relaxed bg-white/5 rounded-lg p-3 border border-white/5">
                        {contacto.asunto}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <ContactStatusButton
                        id={contacto.id}
                        isRead={contacto.leido}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista para ESCRITORIO (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
