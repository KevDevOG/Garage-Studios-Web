import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getClienteById } from "@/app/actions/clientes";
import { createClient } from "@/lib/supabase/server";
import EditarClienteForm from "@/components/admin/EditarClienteForm";
import Link from "next/link";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await getClienteById(id);
  if (!cliente) notFound();

  // Obtener historial de reservas del cliente
  const supabase = await createClient();
  const { data: reservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .eq("cliente_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title={`Cliente: ${cliente.nombre}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel de estadísticas */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-accent">
              Estadísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black text-white">
                  {cliente.total_reservas}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  Total
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-green-400">
                  {cliente.reservas_confirmadas}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  Confirmadas
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-400">
                  {cliente.reservas_completadas}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  Completadas
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-400">
                  {cliente.reservas_canceladas}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  Canceladas
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">
                  Importe Total Generado
                </div>
                <div className="text-3xl font-black text-accent tracking-tighter">
                  {new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  }).format(cliente.importe_total)}
                </div>
                <div className="text-[9px] text-muted font-medium mt-1 uppercase tracking-tighter">
                  Suma de reservas confirmadas y completadas
                </div>
              </div>
              {cliente.servicio_favorito && (
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">
                    Servicio más solicitado
                  </div>
                  <div className="text-sm font-black text-white">
                    {cliente.servicio_favorito.nombre}
                  </div>
                </div>
              )}
              {cliente.ultima_reserva_fecha && (
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">
                    Última Actividad
                  </div>
                  <div className="text-sm font-bold text-white/90">
                    {new Date(
                      cliente.ultima_reserva_fecha + "T00:00:00"
                    ).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>

            {cliente.total_reservas > 1 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent border border-accent/20 w-fit">
                  <span>⟳</span> CLIENTE RECURRENTE
                </div>
              </div>
            )}
          </div>

          {/* Info de auditoría */}
          <div className="rounded-xl border border-card-border bg-card-bg p-4 text-xs text-muted">
            <div className="space-y-1">
              <div>
                Creado:{" "}
                {new Date(cliente.created_at).toLocaleString("es-ES")}
              </div>
              <div>
                Actualizado:{" "}
                {new Date(cliente.updated_at).toLocaleString("es-ES")}
              </div>
              <div className="text-[10px]">ID: {cliente.id}</div>
            </div>
          </div>
        </div>

        {/* Formulario + historial */}
        <div className="space-y-6 lg:col-span-2">
          <EditarClienteForm cliente={cliente} />

          {/* Historial de reservas */}
          <div className="rounded-xl border border-card-border bg-card-bg p-6">
            <h3 className="mb-4 border-b border-white/5 pb-4 text-sm font-black uppercase tracking-widest text-white">
              Historial de Reservas
            </h3>

            {!reservas || reservas.length === 0 ? (
              <p className="text-sm text-muted italic py-2">
                No hay reservas registradas para este cliente.
              </p>
            ) : (
              <div className="space-y-3">
                {reservas.map((res) => (
                  <Link
                    key={res.id}
                    href={`/admin/calendario/${res.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-accent/30 hover:bg-white/[0.05]"
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-white">
                        {new Date(
                          res.fecha_reserva + "T00:00:00"
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {res.hora_inicio && (
                          <span className="ml-2 text-accent font-black">
                            {res.hora_inicio.slice(0, 5)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted">
                        {res.servicio?.nombre || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {res.precio && (
                        <span className="text-xs font-bold text-white/80">
                          {new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          }).format(res.precio)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                          res.estado === "pendiente"
                            ? "bg-amber-500/10 text-amber-400"
                            : res.estado === "confirmada"
                            ? "bg-green-500/10 text-green-400"
                            : res.estado === "completada"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {res.estado}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
