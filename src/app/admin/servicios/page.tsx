import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import ServiceActiveToggle from "@/components/admin/ServiceActiveToggle";
import DeleteServiceButton from "@/components/admin/DeleteServiceButton";

export default async function AdminServiciosPage() {
  const supabase = await createClient();

  // Obtener todos los servicios junto con sus reservas asociadas para contar (evita N+1)
  const { data: servicios } = await supabase
    .from("servicio")
    .select("*, reserva(id)")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <AdminNav title="Servicios" />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/servicios/nuevo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          + Añadir Servicio
        </Link>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        {!servicios || servicios.length === 0 ? (
          <p className="text-sm text-muted">No hay servicios configurados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-muted">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Precio</th>
                  <th className="pb-3 font-medium">Duración</th>
                  <th className="pb-3 font-medium">Reservas</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {servicios.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pr-4 font-medium">{s.nombre}</td>
                    <td className="py-3 pr-4">{s.precio} €</td>
                    <td className="py-3 pr-4">{s.duracion_minutos} min</td>
                    <td className="py-3 pr-4">
                      <span className="inline-block rounded-full bg-card-border px-2.5 py-0.5 text-xs font-semibold text-white">
                        {s.reserva?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <ServiceActiveToggle id={s.id} isActivo={s.activo} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/servicios/${s.id}`}
                        className="text-accent transition-colors hover:text-accent-hover hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteServiceButton id={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
