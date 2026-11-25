"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuditLogRow } from "@/app/actions/auditoria";
import { formatDateTimeEs } from "@/lib/dates";
import { Badge, EmptyState, Field, Panel, buttonClass, cx, table, type Tone } from "@/components/admin/ui";

const PAGE_SIZE = 50;

const ENTIDADES = [
  "todos", "reserva", "cliente", "finanza", "servicio", "galeria", "bloqueo_horario", "cliente_nota", "otros",
];

const ACCIONES = [
  "todos", "creación", "edición", "eliminación", "cambio_estado", "reprogramación", "pago", "login", "otros",
];

function label(value: string): string {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function actionTone(accion: string): Tone {
  const a = accion.toLowerCase();
  if (/elimin|borra|delete/.test(a)) return "bad";
  if (/cre|alta|insert/.test(a)) return "ok";
  if (/edici|edit|cambio|estado|actualiz|reprogram|update/.test(a)) return "info";
  return "neutral";
}

function formatDate(date: string) {
  return formatDateTimeEs(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Metadata({ log }: { log: AuditLogRow }) {
  if (!log.metadata) return null;
  return (
    <details className="group mt-1">
      <summary className="inline-flex min-h-10 cursor-pointer items-center text-[13px] text-gs-soft hover:text-gs-paper md:min-h-0">
        Ver metadatos
      </summary>
      <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-gs-line bg-gs-sunken p-2 text-[12px] leading-relaxed text-gs-soft">
        {JSON.stringify(log.metadata, null, 2)}
      </pre>
    </details>
  );
}

export default function AuditoriaClient({ initialLogs }: { initialLogs: AuditLogRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    entidad: searchParams.get("entidad") || "todos",
    accion: searchParams.get("accion") || "todos",
    fecha: searchParams.get("fecha") || "todo",
    order: searchParams.get("order") || "desc",
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pushFilters = (updated: typeof filters) => {
    const params = new URLSearchParams();
    if (updated.query) params.set("query", updated.query);
    if (updated.entidad !== "todos") params.set("entidad", updated.entidad);
    if (updated.accion !== "todos") params.set("accion", updated.accion);
    if (updated.fecha !== "todo") params.set("fecha", updated.fecha);
    if (updated.order !== "desc") params.set("order", updated.order);

    startTransition(() => {
      router.push(`/admin/auditoria?${params.toString()}`);
    });
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setPage(1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // La búsqueda de texto espera 300 ms tras la última pulsación;
    // el resto de filtros navegan al instante.
    if ("query" in newFilters) {
      debounceRef.current = setTimeout(() => pushFilters(updated), 300);
    } else {
      pushFilters(updated);
    }
  };

  const totalPages = Math.max(1, Math.ceil(initialLogs.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = useMemo(
    () => initialLogs.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [initialLogs, current],
  );
  const from = initialLogs.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, initialLogs.length);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid gap-3 rounded-lg border border-gs-line bg-gs-surface p-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Buscar" htmlFor="audit-query">
          <input
            id="audit-query"
            type="search"
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            placeholder="ID o descripción"
          />
        </Field>
        <Field label="Entidad" htmlFor="audit-entidad">
          <select id="audit-entidad" value={filters.entidad} onChange={(e) => updateFilters({ entidad: e.target.value })}>
            {ENTIDADES.map((e) => (
              <option key={e} value={e}>{label(e)}</option>
            ))}
          </select>
        </Field>
        <Field label="Acción" htmlFor="audit-accion">
          <select id="audit-accion" value={filters.accion} onChange={(e) => updateFilters({ accion: e.target.value })}>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>{label(a)}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha" htmlFor="audit-fecha">
          <select id="audit-fecha" value={filters.fecha} onChange={(e) => updateFilters({ fecha: e.target.value })}>
            <option value="todo">Histórico completo</option>
            <option value="hoy">Hoy</option>
            <option value="7dias">Últimos 7 días</option>
            <option value="este_mes">Este mes</option>
          </select>
        </Field>
        <Field label="Orden" htmlFor="audit-orden">
          <select id="audit-orden" value={filters.order} onChange={(e) => updateFilters({ order: e.target.value })}>
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>
        </Field>
      </div>

      <p role="status" aria-live="polite" className="min-h-5 text-[13px] text-gs-faint">
        {isPending
          ? "Actualizando resultados…"
          : initialLogs.length > 0
            ? `Registros ${from}–${to} de ${initialLogs.length}`
            : ""}
      </p>

      {initialLogs.length === 0 ? (
        <Panel flush>
          <EmptyState
            title="No hay registros"
            hint="Ningún registro coincide con los filtros seleccionados. Prueba a ampliar la fecha o quitar algún filtro."
          />
        </Panel>
      ) : (
        <div className={cx(isPending && "opacity-60 transition-opacity")}>
          {/* Móvil */}
          <ul className="divide-y divide-gs-line rounded-lg border border-gs-line bg-gs-surface md:hidden">
            {visible.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12px] text-gs-faint">{formatDate(log.created_at)}</span>
                  <Badge tone={actionTone(log.accion)}>{label(log.accion)}</Badge>
                </div>
                <p className="mt-1 text-[14px] font-medium text-gs-paper">{label(log.entidad)}</p>
                <p className="mt-0.5 break-words text-[13px] text-gs-soft">{log.descripcion || "Sin descripción"}</p>
                <Metadata log={log} />
              </li>
            ))}
          </ul>

          {/* Escritorio */}
          <div className={cx(table.wrap, "hidden md:block")}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th scope="col" className={table.th}>Fecha y hora</th>
                  <th scope="col" className={table.th}>Acción</th>
                  <th scope="col" className={table.th}>Entidad</th>
                  <th scope="col" className={table.th}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((log) => (
                  <tr key={log.id} className={cx(table.tr, "align-top")}>
                    <td className={cx(table.td, "whitespace-nowrap align-top text-gs-soft")}>{formatDate(log.created_at)}</td>
                    <td className={cx(table.td, "align-top")}>
                      <Badge tone={actionTone(log.accion)} plain>{label(log.accion)}</Badge>
                    </td>
                    <td className={cx(table.td, "align-top")}>
                      <span className="font-medium">{label(log.entidad)}</span>
                      {log.entidad_id && (
                        <div className="font-mono text-[12px] text-gs-faint">{log.entidad_id.slice(0, 8)}…</div>
                      )}
                    </td>
                    <td className={cx(table.td, "align-top")}>
                      <p className="max-w-xl break-words text-gs-soft">{log.descripcion || "—"}</p>
                      <Metadata log={log} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="Paginación" className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
              >
                <ChevronLeft aria-hidden="true" /> Anterior
              </button>
              <span className="text-[13px] text-gs-soft">
                Página {current} de {totalPages}
              </span>
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                disabled={current >= totalPages}
                onClick={() => setPage(current + 1)}
              >
                Siguiente <ChevronRight aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
