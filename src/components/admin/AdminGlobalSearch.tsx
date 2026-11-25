"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Search, User, Calendar, Receipt, MessageSquare, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { searchGlobalAdmin, type SearchResults } from "@/app/actions/admin-search";
import { formatIsoDateEs, formatDateTimeEs } from "@/lib/dates";
import { formatEUR } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import StatusBadge from "@/components/admin/StatusBadge";
import Link from "next/link";

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

const ROW = "flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-white/[0.06]";
const ROW_TITLE = "block truncate text-[14px] font-medium text-gs-paper";
const ROW_META = "block truncate text-[12px] text-gs-soft";

function SectionTitle({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <h3 className="mb-1 flex items-center gap-2 px-3 text-[12px] font-medium text-gs-faint">
      <Icon className="size-3.5" aria-hidden="true" /> {children}
    </h3>
  );
}

/** Buscador del panel: clientes, reservas, movimientos, mensajes y servicios. */
export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const listboxId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const currentRequest = ++requestId.current;
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchGlobalAdmin(trimmed);
        // Descartar respuestas de peticiones antiguas (carreras)
        if (currentRequest !== requestId.current) return;
        setResults(res);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults =
    !!results &&
    (results.clientes.length > 0 ||
      results.reservas.length > 0 ||
      results.finanzas.length > 0 ||
      results.mensajes.length > 0 ||
      results.servicios.length > 0);

  const clear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
  };

  const close = () => setIsOpen(false);

  return (
    <div className="relative w-full max-w-[34rem]" ref={containerRef} role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gs-faint"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Buscar clientes, reservas, movimientos, mensajes y servicios"
          aria-controls={listboxId}
          placeholder="Buscar clientes, reservas, movimientos, mensajes…"
          className="!pl-9 !pr-10 [&::-webkit-search-cancel-button]:hidden"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.trim().length < 2) {
              requestId.current++;
              setResults(null);
              setIsOpen(false);
              setLoading(false);
            }
          }}
          onFocus={() => query.trim().length >= 2 && results && setIsOpen(true)}
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gs-soft"
            aria-label="Buscando"
          />
        ) : (
          query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-gs-soft hover:text-gs-paper"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )
        )}
      </div>

      {isOpen && results && (
        <div
          id={listboxId}
          className="absolute top-full z-50 mt-1.5 max-h-[70vh] w-full overflow-y-auto rounded-lg border border-gs-line-strong bg-gs-raised py-2 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
        >
          {!hasResults ? (
            <p className="px-4 py-3 text-[13px] text-gs-soft">
              Nada coincide con &ldquo;{query}&rdquo;. Prueba con el nombre, el correo o el teléfono.
            </p>
          ) : (
            <div className="space-y-3 px-1">
              {results.clientes.length > 0 && (
                <section>
                  <SectionTitle icon={User}>Clientes</SectionTitle>
                  {results.clientes.map((c) => (
                    <Link key={c.id} href={`/admin/clientes/${c.id}`} onClick={close} className={ROW}>
                      <span className="min-w-0">
                        <span className={ROW_TITLE}>{c.nombre}</span>
                        <span className={ROW_META}>
                          {[c.email, c.telefono].filter(Boolean).join(", ") || "Sin datos de contacto"}
                        </span>
                      </span>
                    </Link>
                  ))}
                </section>
              )}

              {results.reservas.length > 0 && (
                <section>
                  <SectionTitle icon={Calendar}>Reservas</SectionTitle>
                  {results.reservas.map((r) => (
                    <Link key={r.id} href={`/admin/calendario/${r.id}`} onClick={close} className={ROW}>
                      <span className="min-w-0">
                        <span className={ROW_TITLE}>{r.nombre}</span>
                        <span className={ROW_META}>
                          {formatIsoDateEs(r.fecha_reserva, SHORT_DATE)}, {formatTime(r.hora_inicio)}
                          {r.servicio?.nombre ? `, ${r.servicio.nombre}` : ""}
                        </span>
                      </span>
                      <StatusBadge type="reserva" value={r.estado} plain className="shrink-0" />
                    </Link>
                  ))}
                </section>
              )}

              {results.finanzas.length > 0 && (
                <section>
                  <SectionTitle icon={Receipt}>Movimientos</SectionTitle>
                  {results.finanzas.map((f) => (
                    <Link key={f.id} href={`/admin/finanzas/${f.id}`} onClick={close} className={ROW}>
                      <span className="min-w-0">
                        <span className={ROW_TITLE}>{f.concepto}</span>
                        <span className={ROW_META}>{formatIsoDateEs(f.fecha, SHORT_DATE)}</span>
                      </span>
                      <span
                        className={`shrink-0 text-[14px] font-semibold ${f.tipo === "gasto" ? "text-gs-bad" : "text-gs-ok"}`}
                      >
                        <span className="sr-only">{f.tipo === "gasto" ? "Gasto: " : "Ingreso: "}</span>
                        {f.tipo === "gasto" ? "−" : "+"}
                        {formatEUR(Number(f.importe))}
                      </span>
                    </Link>
                  ))}
                </section>
              )}

              {results.mensajes.length > 0 && (
                <section>
                  <SectionTitle icon={MessageSquare}>Mensajes</SectionTitle>
                  {results.mensajes.map((m) => (
                    <Link key={m.id} href="/admin/dashboard#mensajes" onClick={close} className={ROW}>
                      <span className="min-w-0">
                        <span className={ROW_TITLE}>{m.nombre}</span>
                        <span className={ROW_META}>{m.asunto}</span>
                      </span>
                      <span className="shrink-0 text-[12px] text-gs-faint">
                        {formatDateTimeEs(m.created_at, SHORT_DATE)}
                      </span>
                    </Link>
                  ))}
                </section>
              )}

              {results.servicios.length > 0 && (
                <section>
                  <SectionTitle icon={SlidersHorizontal}>Servicios</SectionTitle>
                  {results.servicios.map((s) => (
                    <Link key={s.id} href={`/admin/servicios/${s.id}`} onClick={close} className={ROW}>
                      <span className="min-w-0">
                        <span className={ROW_TITLE}>{s.nombre}</span>
                        <span className={`block text-[12px] ${s.activo ? "text-gs-ok" : "text-gs-faint"}`}>
                          {s.activo ? "Activo" : "Inactivo"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[14px] font-semibold text-gs-paper">
                        {formatEUR(Number(s.precio))}
                      </span>
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
