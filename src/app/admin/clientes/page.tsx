import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getClientes } from "@/app/actions/clientes";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const clientes = await getClientes(params.q);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <AdminNav title="Clientes" />

      {/* Resumen de Clientes */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Clientes</div>
          <div className="mt-1 text-3xl font-black text-white">{clientes.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Clientes Recurrentes</div>
          <div className="mt-1 text-3xl font-black text-white">
            {clientes.filter(c => c.total_reservas > 1).length}
          </div>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-green-400">Importe Total Generado</div>
          <div className="mt-1 text-3xl font-black text-white">
            {new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
            }).format(clientes.reduce((acc, c) => acc + (Number(c.importe_total) || 0), 0))}
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white/[0.02] p-6 rounded-xl border border-white/5">
        <form className="flex w-full max-w-2xl gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              name="q"
              type="text"
              defaultValue={params.q || ""}
              placeholder="Nombre, email o teléfono..."
              className="w-full rounded-lg border border-card-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
          >
            Filtrar
          </button>
          {params.q && (
            <Link
              href="/admin/clientes"
              className="flex items-center rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white hover:bg-white/5"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla de clientes */}
      {clientes.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card-bg p-12 text-center">
          <p className="text-muted italic">No se encontraron clientes con los criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card-bg shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-widest text-muted/50">
                <th className="px-6 py-5 font-bold">Información del Cliente</th>
                <th className="px-6 py-5 font-bold">Contacto</th>
                <th className="px-6 py-5 font-bold">Estado</th>
                <th className="px-6 py-5 font-bold text-center">Reservas Activas</th>
                <th className="px-6 py-5 font-bold text-right">Importe Total</th>
                <th className="px-6 py-5 font-bold">Última Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-5">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="text-base font-black text-white hover:text-accent transition-colors flex flex-col"
                    >
                      {c.nombre}
                      <span className="text-[10px] font-normal text-muted lowercase tracking-normal mt-0.5">ID: {c.id.slice(0, 8)}...</span>
                    </Link>
                    <div className="flex gap-1.5 mt-2">
                      {c.total_reservas > 1 && (
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20">
                          ⟳ RECURRENTE
                        </span>
                      )}
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted border border-white/5">
                        {c.origen}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-foreground/90 font-medium">
                        <span className="opacity-40">📧</span> {c.email || "—"}
                      </div>
                      <div className="flex items-center gap-2 text-muted font-medium">
                        <span className="opacity-40">📱</span> {c.telefono || "—"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                      c.estado === "activo"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : c.estado === "bloqueado"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-white/5 text-muted border border-white/10"
                    }`}>
                      <span className={`h-1 w-1 rounded-full ${
                        c.estado === 'activo' ? 'bg-green-400' : c.estado === 'bloqueado' ? 'bg-red-400' : 'bg-muted'
                      }`} />
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-white">{c.total_reservas}</span>
                      <div className="flex gap-2 text-[9px] font-bold mt-1">
                        <span className="text-green-400/70" title="Confirmadas">CONF:{c.reservas_confirmadas}</span>
                        <span className="text-blue-400/70" title="Completadas">DONE:{c.reservas_completadas}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-accent">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        }).format(c.importe_total)}
                      </span>
                      <span className="text-[9px] text-muted font-bold uppercase tracking-tighter mt-1">Acumulado Confirmado</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/90">
                        {c.ultima_reserva_fecha
                          ? new Date(c.ultima_reserva_fecha + "T00:00:00").toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Sin actividad"}
                      </span>
                      {c.ultima_reserva_at && (
                        <span className="text-[10px] text-muted mt-1">
                          Ref: {new Date(c.ultima_reserva_at).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
