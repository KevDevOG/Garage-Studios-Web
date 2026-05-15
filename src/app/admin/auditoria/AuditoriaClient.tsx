"use client";

import { useState, useTransition } from "react";
import { Search, Filter, Calendar, List, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";

interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ENTIDADES = [
  "todos", "reserva", "cliente", "finanza", "servicio", "galeria", "bloqueo_horario", "cliente_nota", "otros"
];

const ACCIONES = [
  "todos", "creación", "edición", "eliminación", "cambio_estado", "reprogramación", "pago", "login", "otros"
];

export default function AuditoriaClient({ initialLogs }: { initialLogs: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    entidad: searchParams.get("entidad") || "todos",
    accion: searchParams.get("accion") || "todos",
    fecha: searchParams.get("fecha") || "todo",
    order: searchParams.get("order") || "desc",
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid gap-4 bg-card-bg p-4 rounded-xl border border-card-border shadow-xl sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <Search className="w-3 h-3" /> Buscar
          </label>
          <input 
            type="text"
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            placeholder="ID, descripción..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <Filter className="w-3 h-3" /> Entidad
          </label>
          <select 
            value={filters.entidad}
            onChange={(e) => updateFilters({ entidad: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 appearance-none capitalize"
          >
            {ENTIDADES.map(e => <option key={e} value={e} className="bg-zinc-900">{e.replace("_", " ")}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <List className="w-3 h-3" /> Acción
          </label>
          <select 
            value={filters.accion}
            onChange={(e) => updateFilters({ accion: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 appearance-none capitalize"
          >
            {ACCIONES.map(a => <option key={a} value={a} className="bg-zinc-900">{a.replace("_", " ")}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Fecha
          </label>
          <select 
            value={filters.fecha}
            onChange={(e) => updateFilters({ fecha: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 appearance-none"
          >
            <option value="todo" className="bg-zinc-900">Histórico completo</option>
            <option value="hoy" className="bg-zinc-900">Hoy</option>
            <option value="7dias" className="bg-zinc-900">Últimos 7 días</option>
            <option value="este_mes" className="bg-zinc-900">Este mes</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
            Orden
          </label>
          <select 
            value={filters.order}
            onChange={(e) => updateFilters({ order: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent/50 appearance-none"
          >
            <option value="desc" className="bg-zinc-900">Más recientes primero</option>
            <option value="asc" className="bg-zinc-900">Más antiguos primero</option>
          </select>
        </div>
      </div>

      {/* Indicador de carga */}
      {isPending && (
        <div className="text-center py-2">
          <span className="text-[10px] font-black text-accent uppercase animate-pulse">Actualizando resultados...</span>
        </div>
      )}

      {/* Listado / Tabla */}
      <div className="space-y-4">
        {initialLogs.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-card-bg p-12 text-center">
            <p className="text-sm text-muted italic">No hay registros para los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            {/* Móvil */}
            <div className="grid gap-3 md:hidden">
              {initialLogs.map((log) => (
                <div key={log.id} className="bg-card-bg border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted uppercase tracking-tighter">
                        {formatDate(log.created_at)}
                      </span>
                      <span className="text-xs font-black text-white capitalize mt-0.5">
                        {log.entidad.replace("_", " ")}
                      </span>
                    </div>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-black uppercase text-accent border border-white/10">
                      {log.accion}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">
                    &ldquo;{log.descripcion || "Sin descripción"}&rdquo;
                  </p>
                  {log.metadata && (
                    <div className="pt-2 border-t border-white/5">
                      <button 
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="text-[9px] font-bold text-accent uppercase flex items-center gap-1"
                      >
                        {expandedId === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expandedId === log.id ? "Ocultar" : "Ver"} Metadatos
                      </button>
                      {expandedId === log.id && (
                        <pre className="mt-2 p-2 bg-black/40 rounded-lg text-[9px] text-muted overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Escritorio */}
            <div className="hidden md:block rounded-xl border border-card-border bg-card-bg overflow-hidden shadow-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-black/20 text-muted uppercase font-black tracking-widest text-[10px] border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4">Fecha / Hora</th>
                    <th className="px-4 py-4">Acción</th>
                    <th className="px-4 py-4">Entidad</th>
                    <th className="px-4 py-4">Descripción</th>
                    <th className="px-4 py-4 text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {initialLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap text-muted font-medium">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-white/5 px-2 py-1 rounded-lg font-black uppercase text-[9px] text-white/90 border border-white/10">
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white capitalize">{log.entidad.replace("_", " ")}</span>
                        {log.entidad_id && <div className="text-[9px] text-muted font-mono">{log.entidad_id.slice(0, 8)}...</div>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/80 line-clamp-1 italic max-w-xs" title={log.descripcion || ""}>
                          {log.descripcion || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.metadata && (
                          <button 
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-accent transition-colors"
                          >
                            {expandedId === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Metadata Expandida en Escritorio (Flotante o in-row? Mejor in-row si es tabla) */}
            {expandedId && (
              <div className="hidden md:block fixed bottom-8 right-8 w-96 bg-zinc-950 border border-accent/20 rounded-xl shadow-2xl z-50 p-4">
                <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black text-accent uppercase tracking-widest">Metadata Detallada</h4>
                  <button onClick={() => setExpandedId(null)} className="text-muted hover:text-white"><List className="w-4 h-4" /></button>
                </div>
                <pre className="text-[10px] text-muted overflow-y-auto max-h-96 scrollbar-hide">
                  {JSON.stringify(initialLogs.find(l => l.id === expandedId)?.metadata, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
