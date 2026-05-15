"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Calendar, DollarSign, MessageSquare, Briefcase, X, Loader2 } from "lucide-react";
import { searchGlobalAdmin, SearchResults } from "@/app/actions/admin-search";
import Link from "next/link";

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const res = await searchGlobalAdmin(query);
          setResults(res);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const hasResults = results && (
    results.clientes.length > 0 ||
    results.reservas.length > 0 ||
    results.finanzas.length > 0 ||
    results.mensajes.length > 0 ||
    results.servicios.length > 0
  );

  return (
    <div className="relative mb-8" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
        <input
          type="text"
          placeholder="Buscar clientes, reservas, mensajes..."
          className="w-full rounded-2xl border border-card-border bg-card-bg py-3.5 pl-12 pr-12 text-sm text-white placeholder-muted/50 outline-none transition-all focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent animate-spin" />
        ) : query && (
          <button 
            onClick={() => { setQuery(""); setResults(null); setIsOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full z-50 mt-2 w-full max-h-[70vh] overflow-y-auto rounded-2xl border border-card-border bg-card-bg/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {!hasResults ? (
            <div className="py-8 text-center text-muted italic">No se encontraron resultados para "{query}"</div>
          ) : (
            <div className="space-y-4 p-2">
              {/* Clientes */}
              {results.clientes.length > 0 && (
                <div>
                  <h4 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                    <User className="h-3 w-3" /> Clientes
                  </h4>
                  <div className="space-y-1">
                    {results.clientes.map((c) => (
                      <Link key={c.id} href={`/admin/clientes/${c.id}`} onClick={() => setIsOpen(false)} className="flex flex-col px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="font-bold text-white text-sm">{c.nombre}</span>
                        <span className="text-[10px] text-muted">{c.email} • {c.telefono}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Reservas */}
              {results.reservas.length > 0 && (
                <div>
                  <h4 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Reservas
                  </h4>
                  <div className="space-y-1">
                    {results.reservas.map((r) => (
                      <Link key={r.id} href={`/admin/calendario?fecha=${r.fecha_reserva}`} onClick={() => setIsOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{r.nombre}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES")} • {r.hora_inicio?.slice(0, 5)} • {r.servicio?.nombre}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          r.estado === 'confirmada' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 
                          r.estado === 'pendiente' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-white/10 text-muted'
                        }`}>
                          {r.estado}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Finanzas */}
              {results.finanzas.length > 0 && (
                <div>
                  <h4 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                    <DollarSign className="h-3 w-3" /> Finanzas
                  </h4>
                  <div className="space-y-1">
                    {results.finanzas.map((f) => (
                      <Link key={f.id} href={`/admin/finanzas/${f.id}`} onClick={() => setIsOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm truncate max-w-[200px]">{f.concepto}</span>
                          <span className="text-[10px] text-muted">{new Date(f.fecha).toLocaleDateString("es-ES")}</span>
                        </div>
                        <span className={`font-black text-sm ${f.importe >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {f.importe > 0 ? '+' : ''}{f.importe} €
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensajes */}
              {results.mensajes.length > 0 && (
                <div>
                  <h4 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Mensajes
                  </h4>
                  <div className="space-y-1">
                    {results.mensajes.map((m) => (
                      <div key={m.id} className="flex flex-col px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white text-sm">{m.nombre}</span>
                          <span className="text-[9px] text-muted italic">{new Date(m.created_at).toLocaleDateString("es-ES")}</span>
                        </div>
                        <span className="text-[10px] text-muted truncate italic">"{m.asunto}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Servicios */}
              {results.servicios.length > 0 && (
                <div>
                  <h4 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Servicios
                  </h4>
                  <div className="space-y-1">
                    {results.servicios.map((s) => (
                      <Link key={s.id} href={`/admin/servicios/${s.id}`} onClick={() => setIsOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{s.nombre}</span>
                          <span className={`text-[9px] font-bold ${s.activo ? 'text-green-400' : 'text-red-400'}`}>
                            {s.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </div>
                        <span className="font-black text-accent text-sm">{s.precio} €</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
