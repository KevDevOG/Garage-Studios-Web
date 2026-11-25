"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ClienteRow } from "@/app/actions/clientes";
import { getZonedParts } from "@/lib/dates";
import { formatEUR, plural } from "@/lib/format";
import StatusBadge from "@/components/admin/StatusBadge";
import { EmptyState, buttonClass, cx, table, textLink } from "@/components/admin/ui";

type Filter = "todos" | "recurrentes" | "nuevos";

const PAGE_SIZE = 50;
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "recurrentes", label: "Recurrentes" },
  { id: "nuevos", label: "Nuevos" },
];

function Tags({ tags, max }: { tags: string[]; max: number }) {
  if (tags.length === 0) return null;
  return (
    <>
      {tags.slice(0, max).map((t) => (
        <span key={t} className="rounded-md border border-gs-line bg-gs-raised px-1.5 py-0.5 text-[12px] leading-none text-gs-soft">
          {t}
        </span>
      ))}
      {tags.length > max && <span className="text-[12px] text-gs-faint">+{tags.length - max}</span>}
    </>
  );
}

export default function ClientesLista({
  clientes,
  view,
  month,
  year,
  initialQuery,
}: {
  clientes: ClienteRow[];
  view: "monthly" | "yearly";
  month: number;
  year: number;
  initialQuery: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterType, setFilterType] = useState<Filter>("todos");
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(clientes.flatMap((c) => c.etiquetas || []))).sort(),
    [clientes],
  );

  const filtered = useMemo(
    () =>
      clientes.filter((c) => {
        if (filterType === "recurrentes" && c.total_reservas <= 1) return false;
        if (filterType === "nuevos") {
          const created = getZonedParts(new Date(c.created_at));
          const inPeriod = view === "monthly" ? created.month === month && created.year === year : created.year === year;
          if (!inPeriod) return false;
        }
        if (tagFilter && !(c.etiquetas || []).includes(tagFilter)) return false;
        return true;
      }),
    [clientes, filterType, tagFilter, view, month, year],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE),
    [filtered, current],
  );

  // Búsqueda con debounce de 300 ms: actualiza ?q= conservando periodo y vista.
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const monthPart = view === "monthly" ? `&month=${month}` : "";
      const q = value.trim() ? `&q=${encodeURIComponent(value.trim())}` : "";
      startTransition(() => {
        router.push(`/admin/clientes?view=${view}&year=${year}${monthPart}${q}`);
      });
    }, 300);
  };

  const rangeStart = filtered.length === 0 ? 0 : current * PAGE_SIZE + 1;
  const rangeEnd = Math.min((current + 1) * PAGE_SIZE, filtered.length);

  return (
    <section aria-labelledby="clientes-listado" aria-busy={isPending} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="clientes-listado" className="text-[16px] font-semibold text-gs-paper">
          Listado de clientes
        </h2>
        <p className="text-[13px] text-gs-faint" aria-live="polite">
          {isPending ? "Actualizando…" : `Mostrando ${filtered.length} de ${clientes.length}`}
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <label htmlFor="clientes-search" className="sr-only">Buscar clientes</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gs-faint" />
          <input
            id="clientes-search"
            type="search"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono"
            maxLength={80}
            className="!pl-9"
          />
        </div>

        <div role="group" aria-label="Tipo de cliente" className="inline-flex self-start rounded-md border border-gs-line bg-gs-surface p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filterType === f.id}
              onClick={() => {
                setFilterType(f.id);
                setPage(0);
              }}
              className={cx(
                "inline-flex h-10 items-center rounded-[5px] px-3 text-[13px] font-medium leading-none sm:h-8",
                filterType === f.id
                  ? "bg-gs-raised text-gs-paper shadow-[inset_0_0_0_1px_#33363b]"
                  : "text-gs-soft hover:text-gs-paper",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div>
            <label htmlFor="clientes-etiqueta" className="sr-only">Filtrar por etiqueta</label>
            <select
              id="clientes-etiqueta"
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setPage(0);
              }}
              className="w-full md:w-auto"
            >
              <option value="">Todas las etiquetas</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gs-line bg-gs-surface">
          <EmptyState
            title="Ningún cliente coincide con los filtros"
            hint="Prueba con otra búsqueda o quita el filtro de tipo o etiqueta."
          />
        </div>
      ) : (
        <>
          {/* Tabla en pantallas medianas y grandes */}
          <div className={cx(table.wrap, "hidden md:block")}>
            <table className={table.table}>
              <caption className="sr-only">Listado de clientes</caption>
              <thead>
                <tr>
                  <th scope="col" className={table.th}>Cliente</th>
                  <th scope="col" className={table.th}>Contacto</th>
                  <th scope="col" className={cx(table.th, table.num)}>Reservas</th>
                  <th scope="col" className={cx(table.th, table.num)}>Importe total</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className={table.tr}>
                    <td className={cx(table.td, "max-w-[28rem]")}>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`/admin/clientes/${c.id}`} className={cx("truncate font-medium", textLink)}>
                          {c.nombre}
                        </Link>
                        {c.total_reservas > 1 && <StatusBadge type="cliente" value="recurrente" plain />}
                        <Tags tags={c.etiquetas || []} max={3} />
                      </div>
                    </td>
                    <td className={cx(table.td, "max-w-[18rem] truncate text-gs-soft")}>
                      {c.email || c.telefono || "—"}
                    </td>
                    <td className={cx(table.td, table.num)}>{c.total_reservas}</td>
                    <td className={cx(table.td, table.num, c.importe_total > 0 ? "text-gs-ok" : "text-gs-faint")}>
                      {formatEUR(c.importe_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista apilada en móvil */}
          <ul className="divide-y divide-gs-line rounded-lg border border-gs-line bg-gs-surface md:hidden">
            {visible.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clientes/${c.id}`} className="block min-h-14 px-4 py-3 hover:bg-gs-raised">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[14px] font-medium text-gs-paper">{c.nombre}</span>
                    <span className={cx("shrink-0 text-[14px] tabular-nums", c.importe_total > 0 ? "text-gs-ok" : "text-gs-faint")}>
                      {formatEUR(c.importe_total)}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-gs-faint">
                    <span>{plural(c.total_reservas, "reserva", "reservas")}</span>
                    {c.total_reservas > 1 && <StatusBadge type="cliente" value="recurrente" plain />}
                    <Tags tags={c.etiquetas || []} max={2} />
                  </span>
                  {(c.email || c.telefono) && (
                    <span className="mt-1 block truncate text-[12px] text-gs-soft">{c.email || c.telefono}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <nav aria-label="Paginación del listado" className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-gs-faint">
                {rangeStart}–{rangeEnd} de {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={buttonClass("secondary", "md")}
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  <ChevronLeft aria-hidden /> Anterior
                </button>
                <button
                  type="button"
                  className={buttonClass("secondary", "md")}
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Siguiente <ChevronRight aria-hidden />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
