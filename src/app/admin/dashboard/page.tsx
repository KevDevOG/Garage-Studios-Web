import { createClient } from "@/lib/supabase/server";
import ReservationStatusSelect from "@/components/ReservationStatusSelect";
import ContactStatusButton from "@/components/ContactStatusButton";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  // Obtenemos la información del usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtenemos las últimas 10 reservas, ordenadas por fecha (join con la tabla servicio para el nombre)
  const { data: reservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .order("fecha_reserva", { ascending: false })
    .limit(10);

  // Obtenemos los últimos 10 mensajes de contacto, ordenados por fecha de creación
  const { data: contactos } = await supabase
    .from("contacto")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <AdminNav title="Dashboard" />

      {/* Info del usuario logueado */}
      <div className="mb-8 rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="font-medium text-accent">¡Hola de nuevo!</h2>
        <p className="mt-1 text-sm text-muted">
          Has iniciado sesión como:{" "}
          <span className="font-semibold text-foreground">{user?.email}</span>
        </p>
      </div>

      {/* Listados */}
      <div className="grid gap-6">
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h3 className="mb-4 border-b border-card-border pb-4 text-lg font-semibold">
            Últimas Reservas
          </h3>

          {!reservas || reservas.length === 0 ? (
            <p className="text-sm text-muted">No hay reservas recientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border text-muted">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Servicio</th>
                    <th className="pb-3 font-medium">Contacto</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {reservas.map((res) => (
                    <tr
                      key={res.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap py-3 pr-4">
                        {new Date(res.fecha_reserva).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 pr-4 font-medium">{res.nombre}</td>
                      <td className="py-3 pr-4">
                        {/* En Supabase una relación FK de muchos a uno devuelve un objeto */}
                        {res.servicio?.nombre || "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        <div>{res.email}</div>
                        <div className="text-xs">{res.telefono}</div>
                      </td>
                      <td className="py-3">
                        <ReservationStatusSelect 
                          id={res.id} 
                          currentStatus={res.estado} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
