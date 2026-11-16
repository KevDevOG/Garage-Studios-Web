"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Search, User, Calendar, DollarSign, MessageSquare, Briefcase, X, Loader2 } from "lucide-react";
import { searchGlobalAdmin, type SearchResults } from "@/app/actions/admin-search";
import { formatIsoDateEs, formatDateTimeEs } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";
import StatusBadge from "@/components/admin/StatusBadge";
import Link from "next/link";

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

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
    if (trimmed.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

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

  const SectionTitle = ({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) => (
    <h3 className="mb-2 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-widest text-muted">
      <Icon className="h-3 w-3" aria-hidden="true" /> {children}
    </h3>
  );

  return (
    <div className="relative mb-8" ref={containerRef} role="search">
      <div className="group relative">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted transition-colors group-focus-within:text-accent"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Buscar clientes, reservas, finanzas, mensajes y servicios"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          placeholder="Buscar clientes, reservas, mensajes..."
          className="w-full rounded-2xl border border-card-border bg-card-bg py-3.5 pl-12 pr-12 text-sm text-white placeholder-muted/60 outline-none transition-all focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && results && setIsOpen(true)}
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-accent" aria-label="Buscando" />
        ) : (
          query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )
        )}
      </div>

      {isOpen && results && (
        <div
          id={listboxId}
          className="absolute top-full z-50 mt-2 max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-card-border bg-card-bg/95 p-2 shadow-2xl backdrop-blur-xl"
        >
          {!hasResults ? (
            <p className="py-8 text-center italic text-muted">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="space-y-4 p-2">
              {results.clientes.length > 0 && (
                <section>
                  <SectionTitle icon={User}>Clientes</SectionTitle>
                  <div className="space-y-1">
                    {results.clientes.map((c) => (
                      <Link
                        key={c.id}
                        href={`/admin/clientes/${c.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <span className="text-sm font-bold text-white">{c.nombre}</span>
                        <span className="text-[11px] text-muted">
                          {[c.email, c.telefono].filter(Boolean).join(" • ") || "Sin datos de contacto"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.reservas.length > 0 && (
                <section>
                  <SectionTitle icon={Calendar}>Reservas</SectionTitle>
                  <div className="space-y-1">
                    {results.reservas.map((r) => (
                      <Link
                        key={r.id}
                        href={`/admin/calendario/${r.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold text-white">{r.nombre}</span>
                          <span className="text-[11px] text-muted">
                            {formatIsoDateEs(r.fecha_reserva, SHORT_DATE)} • {formatTime(r.hora_inicio)}
                            {r.servicio?.nombre ? ` • ${r.servicio.nombre}` : ""}
                          </span>
                        </div>
                        <StatusBadge type="reserva" value={r.estado} />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.finanzas.length > 0 && (
                <section>
                  <SectionTitle icon={DollarSign}>Finanzas</SectionTitle>
                  <div className="space-y-1">
                    {results.finanzas.map((f) => (
                      <Link
                        key={f.id}
                        href={`/admin/finanzas/${f.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold text-white">{f.concepto}</span>
                          <span className="text-[11px] text-muted">{formatIsoDateEs(f.fecha, SHORT_DATE)}</span>
                        </div>
                        <span className={`text-sm font-black ${f.tipo === "gasto" ? "text-red-400" : "text-green-400"}`}>
                          {f.tipo === "gasto" ? "-" : "+"}
                          {Number(f.importe).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.mensajes.length > 0 && (
                <section>
                  <SectionTitle icon={MessageSquare}>Mensajes</SectionTitle>
                  <div className="space-y-1">
                    {results.mensajes.map((m) => (
                      <Link
                        key={m.id}
                        href="/admin/dashboard#mensajes"
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-bold text-white">{m.nombre}</span>
                          <span className="shrink-0 text-[11px] italic text-muted">
                            {formatDateTimeEs(m.created_at, SHORT_DATE)}
                          </span>
                        </div>
                        <span className="truncate text-[11px] italic text-muted">&ldquo;{m.asunto}&rdquo;</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.servicios.length > 0 && (
                <section>
                  <SectionTitle icon={Briefcase}>Servicios</SectionTitle>
                  <div className="space-y-1">
                    {results.servicios.map((s) => (
                      <Link
                        key={s.id}
                        href={`/admin/servicios/${s.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold text-white">{s.nombre}</span>
                          <span className={`text-[11px] font-bold ${s.activo ? "text-green-400" : "text-red-400"}`}>
                            {s.activo ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </div>
                        <span className="text-sm font-black text-accent">{s.precio} €</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
