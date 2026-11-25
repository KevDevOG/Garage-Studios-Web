import { notFound } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getClienteById, getClienteCommercialStats, getClienteNotas } from "@/app/actions/clientes";
import { createClient } from "@/lib/supabase/server";
import EditarClienteForm from "@/components/admin/EditarClienteForm";
import ClienteTagsEditor from "@/components/admin/ClienteTagsEditor";
import ClienteNotas from "@/components/admin/ClienteNotas";
import ClienteStatsCards from "@/components/admin/ClienteStatsCards";
import ClienteQuickActions from "@/components/admin/ClienteQuickActions";
import VincularReservasBtn from "@/components/admin/VincularReservasBtn";
import StatusBadge from "@/components/admin/StatusBadge";
import { EmptyState, Notice, Page, Panel, cx, table, textLink } from "@/components/admin/ui";
import { formatEUR, plural } from "@/lib/format";

const formatFecha = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Lecturas independientes en paralelo
  const [cliente, commercialStats, notas, reservasRes] = await Promise.all([
    getClienteById(id),
    getClienteCommercialStats(id),
    getClienteNotas(id),
    supabase
      .from("reserva")
      .select("*, servicio(nombre)")
      .eq("cliente_id", id)
      .is("deleted_at", null)
      .order("fecha_reserva", { ascending: false })
      .limit(50),
  ]);
  if (!cliente) notFound();

  const reservas = reservasRes.data;
  const reservasError = reservasRes.error;

  return (
    <Page width="wide">
      <AdminNav
        title={cliente.nombre}
        description={`${cliente.estado.charAt(0).toUpperCase()}${cliente.estado.slice(1)}, origen: ${cliente.origen}`}
        actions={
          <ClienteQuickActions
            nombre={cliente.nombre}
            email={cliente.email}
            telefono={cliente.telefono}
            instagram={cliente.instagram}
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Columna principal: cifras y reservas */}
        <div className="min-w-0 space-y-5 lg:col-span-8">
          <ClienteStatsCards stats={commercialStats} />

          <Panel
            title="Reservas"
            meta={reservas ? plural(reservas.length, "reserva", "reservas") : undefined}
            action={<VincularReservasBtn clienteId={cliente.id} />}
            flush
          >
            {reservasError ? (
              <div className="p-4">
                <Notice title="No se pudieron cargar las reservas">Recarga la página para intentarlo de nuevo.</Notice>
              </div>
            ) : !reservas || reservas.length === 0 ? (
              <EmptyState
                title="Este cliente aún no tiene reservas"
                hint="Crea una con «Nueva reserva» o vincula las reservas antiguas que coincidan con sus datos."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className={table.table}>
                    <caption className="sr-only">Historial de reservas del cliente</caption>
                    <thead>
                      <tr>
                        <th scope="col" className={table.th}>Fecha</th>
                        <th scope="col" className={table.th}>Servicio</th>
                        <th scope="col" className={table.th}>Estado</th>
                        <th scope="col" className={table.th}>Pago</th>
                        <th scope="col" className={cx(table.th, table.num)}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map((res) => (
                        <tr key={res.id} className={table.tr}>
                          <td className={cx(table.td, "whitespace-nowrap")}>
                            <Link href={`/admin/calendario/${res.id}`} className={textLink}>
                              {formatFecha(res.fecha_reserva)}
                            </Link>
                            {res.hora_inicio && (
                              <span className="ml-2 text-gs-faint tabular-nums">{res.hora_inicio.slice(0, 5)}</span>
                            )}
                          </td>
                          <td className={cx(table.td, "max-w-[16rem] truncate")}>
                            {res.servicio?.nombre || "Servicio desconocido"}
                          </td>
                          <td className={table.td}>
                            <StatusBadge type="reserva" value={res.estado} plain />
                          </td>
                          <td className={table.td}>
                            <StatusBadge type="pago" value={res.estado_pago} plain />
                          </td>
                          <td className={cx(table.td, table.num)}>{formatEUR(res.precio || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-gs-line md:hidden">
                  {reservas.map((res) => (
                    <li key={res.id}>
                      <Link href={`/admin/calendario/${res.id}`} className="block min-h-14 px-4 py-3 hover:bg-gs-raised">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-[14px] font-medium text-gs-paper">
                            {res.servicio?.nombre || "Servicio desconocido"}
                          </span>
                          <span className="shrink-0 text-[14px] tabular-nums text-gs-paper">
                            {formatEUR(res.precio || 0)}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gs-faint">
                          <span>
                            {formatFecha(res.fecha_reserva)}
                            {res.hora_inicio ? ` · ${res.hora_inicio.slice(0, 5)}` : ""}
                          </span>
                          <StatusBadge type="reserva" value={res.estado} plain />
                          <StatusBadge type="pago" value={res.estado_pago} plain />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>

        {/* Columna lateral: etiquetas, notas y datos */}
        <div className="min-w-0 space-y-5 lg:col-span-4">
          <ClienteTagsEditor clienteId={cliente.id} initialTags={cliente.etiquetas || []} />
          <ClienteNotas clienteId={cliente.id} initialNotas={notas} />

          <Panel title="Datos del cliente">
            <EditarClienteForm cliente={cliente} />
          </Panel>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-1 text-[12px] text-gs-faint">
            <dt>Creado</dt>
            <dd>{new Date(cliente.created_at).toLocaleString("es-ES")}</dd>
            <dt>Actualizado</dt>
            <dd>{new Date(cliente.updated_at).toLocaleString("es-ES")}</dd>
            <dt>ID</dt>
            <dd className="break-all">{cliente.id}</dd>
          </dl>
        </div>
      </div>
    </Page>
  );
}
