import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEUR, plural } from "@/lib/format";
import AdminNav from "@/components/admin/AdminNav";
import ServiceActiveToggle from "@/components/admin/ServiceActiveToggle";
import DeleteServiceButton from "@/components/admin/DeleteServiceButton";
import {
  EmptyState,
  LinkButton,
  Page,
  Segmented,
  buttonClass,
  table,
  cx,
} from "@/components/admin/ui";
import Link from "next/link";

type Estado = "activos" | "inactivos" | "todos";

type ServicioFila = {
  id: string;
  nombre: string;
  precio: number | string;
  duracion_minutos: number;
  activo: boolean;
  reserva: { count: number }[] | null;
};

function formatDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function reservasDe(s: ServicioFila): number {
  return s.reserva?.[0]?.count ?? 0;
}

export default async function AdminServiciosPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const raw = Array.isArray(searchParams.estado) ? searchParams.estado[0] : searchParams.estado;
  const estado: Estado = raw === "inactivos" || raw === "todos" ? raw : "activos";

  const supabase = await createClient();

  const { data } = await supabase
    .from("servicio")
    .select("id, nombre, precio, duracion_minutos, activo, reserva(count)")
    .order("created_at", { ascending: false });

  const servicios = (data ?? []) as unknown as ServicioFila[];
  const nActivos = servicios.filter((s) => s.activo).length;
  const nInactivos = servicios.length - nActivos;

  const visibles =
    estado === "todos"
      ? servicios
      : servicios.filter((s) => (estado === "activos" ? s.activo : !s.activo));

  const items = [
    { href: "/admin/servicios?estado=activos", label: `Activos (${nActivos})`, active: estado === "activos" },
    { href: "/admin/servicios?estado=inactivos", label: `Inactivos (${nInactivos})`, active: estado === "inactivos" },
    { href: "/admin/servicios?estado=todos", label: `Todos (${servicios.length})`, active: estado === "todos" },
  ];

  return (
    <Page width="wide">
      <AdminNav
        title="Servicios"
        description={`${plural(servicios.length, "servicio", "servicios")}: ${nActivos} ${
          nActivos === 1 ? "activo" : "activos"
        } y ${nInactivos} ${nInactivos === 1 ? "inactivo" : "inactivos"}.`}
        actions={
          <LinkButton href="/admin/servicios/nuevo" variant="primary">
            <Plus aria-hidden strokeWidth={2} />
            Nuevo servicio
          </LinkButton>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <Segmented items={items} label="Filtrar servicios por estado" />
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-lg border border-gs-line bg-gs-surface">
          <EmptyState
            title={
              servicios.length === 0
                ? "Todavía no hay servicios"
                : estado === "activos"
                  ? "No hay servicios activos"
                  : "No hay servicios inactivos"
            }
            hint={
              servicios.length === 0
                ? "Crea el primero para que aparezca en la web y se pueda reservar."
                : "Cambia el filtro para ver el resto de servicios."
            }
            action={
              servicios.length === 0 ? (
                <LinkButton href="/admin/servicios/nuevo" variant="secondary">
                  Nuevo servicio
                </LinkButton>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Móvil: lista apilada */}
          <ul className="divide-y divide-gs-line overflow-hidden rounded-lg border border-gs-line bg-gs-surface md:hidden">
            {visibles.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/servicios/${s.id}`}
                    className="min-w-0 text-[14px] font-medium leading-snug text-gs-paper hover:underline"
                  >
                    {s.nombre}
                  </Link>
                  <ServiceActiveToggle id={s.id} isActivo={s.activo} />
                </div>
                <p className="mt-1 text-[13px] text-gs-soft">
                  {formatEUR(Number(s.precio))} · {formatDuracion(s.duracion_minutos)} ·{" "}
                  {plural(reservasDe(s), "reserva", "reservas")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/servicios/${s.id}`}
                    className={buttonClass("secondary", "sm")}
                    aria-label={`Editar ${s.nombre}`}
                  >
                    <Pencil aria-hidden strokeWidth={1.75} />
                    Editar
                  </Link>
                  <DeleteServiceButton id={s.id} nombre={s.nombre} />
                </div>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla densa */}
          <div className={cx(table.wrap, "hidden md:block")}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th scope="col" className={table.th}>Nombre</th>
                  <th scope="col" className={cx(table.th, table.num)}>Precio</th>
                  <th scope="col" className={table.th}>Duración</th>
                  <th scope="col" className={cx(table.th, table.num)}>Reservas</th>
                  <th scope="col" className={table.th}>Estado</th>
                  <th scope="col" className={cx(table.th, "text-right")}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id} className={table.tr}>
                    <td className={cx(table.td, "font-medium")}>{s.nombre}</td>
                    <td className={cx(table.td, table.num)}>{formatEUR(Number(s.precio))}</td>
                    <td className={cx(table.td, "text-gs-soft")}>{formatDuracion(s.duracion_minutos)}</td>
                    <td className={cx(table.td, table.num)}>{reservasDe(s)}</td>
                    <td className={table.td}>
                      <ServiceActiveToggle id={s.id} isActivo={s.activo} />
                    </td>
                    <td className={table.td}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/servicios/${s.id}`}
                          className={buttonClass("ghost", "sm")}
                          aria-label={`Editar ${s.nombre}`}
                        >
                          <Pencil aria-hidden strokeWidth={1.75} />
                          Editar
                        </Link>
                        <DeleteServiceButton id={s.id} nombre={s.nombre} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Page>
  );
}
