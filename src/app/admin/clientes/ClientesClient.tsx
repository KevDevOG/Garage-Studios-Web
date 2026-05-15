"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClienteRow, ClientesMetrics, TopClienteRanking, ClienteEvolution } from "@/app/actions/clientes";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";

interface ClientesClientProps {
  view: "monthly" | "yearly";
  month: number;
  year: number;
  metrics: ClientesMetrics;
  topByRevenue: TopClienteRanking[];
  topByReservations: TopClienteRanking[];
  clientes: ClienteRow[];
  evolution?: ClienteEvolution[];
}

export default function ClientesClient({ 
  view,
  month, 
  year, 
  metrics, 
  topByRevenue, 
  topByReservations, 
  clientes,
  evolution = []
}: ClientesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterType, setFilterType] = useState<"todos" | "recurrentes" | "nuevos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Obtener todas las etiquetas únicas presentes en el listado para el selector
  const allAvailableTags = Array.from(new Set(clientes.flatMap(c => c.etiquetas || []))).sort();

  const handlePeriodChange = (delta: number) => {
    if (view === "monthly") {
      let newMonth = month + delta;
      let newYear = year;
      if (newMonth > 12) { newMonth = 1; newYear++; }
      else if (newMonth < 1) { newMonth = 12; newYear--; }
      router.push(`/admin/clientes?view=monthly&month=${newMonth}&year=${newYear}${searchTerm ? `&q=${searchTerm}` : ""}`);
    } else {
      const newYear = year + delta;
      router.push(`/admin/clientes?view=yearly&year=${newYear}${searchTerm ? `&q=${searchTerm}` : ""}`);
    }
  };

  const toggleView = (newView: "monthly" | "yearly") => {
    router.push(`/admin/clientes?view=${newView}&year=${year}${newView === 'monthly' ? `&month=${month}` : ""}${searchTerm ? `&q=${searchTerm}` : ""}`);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  

  const MESES = [
    { val: 1, name: "Enero" }, { val: 2, name: "Febrero" }, { val: 3, name: "Marzo" },
    { val: 4, name: "Abril" }, { val: 5, name: "Mayo" }, { val: 6, name: "Junio" },
    { val: 7, name: "Julio" }, { val: 8, name: "Agosto" }, { val: 9, name: "Septiembre" },
    { val: 10, name: "Octubre" }, { val: 11, name: "Noviembre" }, { val: 12, name: "Diciembre" }
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: (currentYear + 1) - 2025 + 1 }, (_, i) => 2025 + i);

  const handleMonthSelect = (m: string) => {
    router.push(`/admin/clientes?view=monthly&month=${m}&year=${year}${searchTerm ? `&q=${searchTerm}` : ""}`);
  };

  const handleYearSelect = (y: string) => {
    router.push(`/admin/clientes?view=${view}&year=${y}${view === 'monthly' ? `&month=${month}` : ""}${searchTerm ? `&q=${searchTerm}` : ""}`);
  };

  const filteredList = clientes.filter(c => {
    if (filterType === "recurrentes" && c.total_reservas <= 1) return false;
    if (filterType === "nuevos") {
      const created = new Date(c.created_at);
      if (view === "monthly") {
        return created.getMonth() + 1 === month && created.getFullYear() === year;
      } else {
        return created.getFullYear() === year;
      }
    }
    if (tagFilter && !(c.etiquetas || []).includes(tagFilter)) return false;
    return true;
  });

  const maxRevenue = Math.max(...topByRevenue.map(c => c.total_pagado), 1);
  const maxReservations = Math.max(...topByReservations.map(c => c.reservas), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-card-bg p-6 rounded-2xl border border-card-border shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          {/* Selector de Periodo */}
          <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/5">
            <button onClick={() => handlePeriodChange(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-2 items-center">
              {view === "monthly" && (
                <select 
                  value={month}
                  onChange={(e) => handleMonthSelect(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer hover:text-accent transition-colors appearance-none text-center px-2"
                >
                  {MESES.map(m => (
                    <option key={m.val} value={m.val} className="bg-card-bg text-white">{m.name}</option>
                  ))}
                </select>
              )}
              
              <select 
                value={year}
                onChange={(e) => handleYearSelect(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer hover:text-accent transition-colors appearance-none text-center px-2"
              >
                {YEARS.map(y => (
                  <option key={y} value={y} className="bg-card-bg text-white">{y}</option>
                ))}
              </select>
            </div>

            <button onClick={() => handlePeriodChange(1)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-muted hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Vista */}
          <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/5">
            <button 
              onClick={() => toggleView("monthly")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'monthly' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-muted hover:text-white'}`}
            >
              Mensual
            </button>
            <button 
              onClick={() => toggleView("yearly")}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'yearly' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-muted hover:text-white'}`}
            >
              Anual
            </button>
          </div>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card-bg p-4 rounded-xl border border-card-border shadow-lg">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">
            {view === 'monthly' ? 'Nuevos (Mes)' : 'Nuevos (Año)'}
          </p>
          <p className="text-2xl font-black text-white">{metrics.nuevos}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border shadow-lg border-l-accent/30">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">
            {view === 'monthly' ? 'Recurrentes (Mes)' : 'Recurrentes (Año)'}
          </p>
          <p className="text-2xl font-black text-accent">{metrics.recurrentes}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border shadow-lg">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">Reservas Periodo</p>
          <p className="text-2xl font-black text-white">{metrics.reservas}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border shadow-lg">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">Ingresos Totales</p>
          <p className="text-2xl font-black text-green-400">{formatCurrency(metrics.ingresos)}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border shadow-lg">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1 font-bold">Ticket Medio</p>
          <p className="text-2xl font-black text-white">{formatCurrency(metrics.ticketMedio)}</p>
        </div>
      </div>

      {/* Rankings & Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top por Ingresos */}
        <div className="bg-card-bg p-6 rounded-xl border border-card-border">
          <h3 className="text-sm font-bold uppercase mb-6 text-muted tracking-widest border-b border-white/5 pb-3">
            Top Clientes por Ingresos
          </h3>
          <div className="space-y-6">
            {topByRevenue.length > 0 ? (
              topByRevenue.map((c) => (
                <div key={c.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <Link href={`/admin/clientes/${c.id}`} className="text-sm font-bold text-white hover:text-accent transition-colors flex items-center gap-2">
                        {c.nombre}
                        {c.es_recurrente && (
                          <span className="text-[8px] bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                            <RefreshCw className="w-2 h-2" /> RECURRENTE
                          </span>
                        )}
                      </Link>
                      <span className="text-[10px] text-muted font-medium">{c.ultimo_servicio || "Servicio no especificado"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-400">{formatCurrency(c.total_pagado)}</p>
                      <p className="text-[9px] text-muted font-bold uppercase tracking-tighter">{c.reservas} reservas</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 group-hover:bg-green-400" 
                      style={{ width: `${(c.total_pagado / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted text-xs italic py-8">No hay datos de ingresos {view === 'monthly' ? 'este mes' : 'este año'}.</p>
            )}
          </div>
        </div>

        {/* Top por Reservas */}
        <div className="bg-card-bg p-6 rounded-xl border border-card-border">
          <h3 className="text-sm font-bold uppercase mb-6 text-muted tracking-widest border-b border-white/5 pb-3">
            Clientes con más Reservas
          </h3>
          <div className="space-y-6">
            {topByReservations.length > 0 ? (
              topByReservations.map((c) => (
                <div key={c.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <Link href={`/admin/clientes/${c.id}`} className="text-sm font-bold text-white hover:text-accent transition-colors flex items-center gap-2">
                        {c.nombre}
                        {c.es_recurrente && (
                          <span className="text-[8px] bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                            <RefreshCw className="w-2 h-2" /> RECURRENTE
                          </span>
                        )}
                      </Link>
                      <span className="text-[10px] text-muted font-medium">{c.ultimo_servicio || "—"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{c.reservas} Reservas</p>
                      <p className="text-[9px] text-muted font-bold uppercase tracking-tighter">Total: {formatCurrency(c.total_pagado)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-accent h-1.5 rounded-full transition-all duration-1000 group-hover:bg-accent-hover" 
                      style={{ width: `${(c.reservas / maxReservations) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted text-xs italic py-8">No hay actividad {view === 'monthly' ? 'este mes' : 'este año'}.</p>
            )}
          </div>
        </div>

      </div>

      {/* Gráfica Anual (solo en vista anual) */}
      {view === 'yearly' && (
        <div className="bg-card-bg p-6 rounded-xl border border-card-border shadow-xl">
          <h3 className="text-sm font-bold uppercase mb-8 text-muted tracking-widest border-b border-white/5 pb-3">
            Evolución anual de clientes ({year})
          </h3>
          
          {evolution.length > 0 && metrics.reservas > 0 ? (
            <div className="flex items-end justify-between h-48 gap-1 sm:gap-2 px-2 border-b border-white/10 pb-2">
              {evolution.map((m, idx) => {
                const maxVal = Math.max(...evolution.map(e => e.ingresos), 1);
                const height = (m.ingresos / maxVal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl border border-black/10">
                      <p className="text-accent">{m.ingresos > 0 ? formatCurrency(m.ingresos) : '0 €'}</p>
                      <p>{m.reservas} reservas</p>
                      <p className="text-muted">{m.nuevos} nuevos</p>
                    </div>
                    
                    {/* Barra Ingresos */}
                    <div 
                      className="w-full bg-accent/40 rounded-t group-hover:bg-accent transition-all duration-500" 
                      style={{ height: `${height}%`, minHeight: m.ingresos > 0 ? '2px' : '0px' }}
                    ></div>
                    
                    <span className="text-[9px] font-bold text-muted uppercase mt-3 group-hover:text-white transition-colors">{m.month}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted italic text-sm">No hay datos de clientes para este año.</p>
            </div>
          )}
          
          <div className="mt-4 flex gap-6 justify-center">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted tracking-widest">
               <div className="w-2.5 h-2.5 bg-accent rounded-sm"></div> Ingresos
             </div>
             <div className="text-[9px] font-bold text-muted/50 tracking-widest">
               * Hover para ver detalle de reservas y nuevos clientes
             </div>
          </div>
        </div>
      )}

      {/* Barra comparativa Nuevos vs Recurrentes */}
      <div className="bg-card-bg p-6 rounded-xl border border-card-border">
        <h3 className="text-sm font-bold uppercase mb-6 text-muted tracking-widest border-b border-white/5 pb-3 flex justify-between items-center">
          Actividad: Nuevos vs Recurrentes
          <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white rounded-full"></div> Nuevos</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-accent rounded-full"></div> Recurrentes</div>
          </div>
        </h3>
        {metrics.nuevos + metrics.recurrentes > 0 ? (
          <div className="space-y-4">
            <div className="w-full flex h-8 rounded-lg overflow-hidden border border-white/5">
              <div 
                className="bg-white flex items-center justify-center text-[10px] font-black text-black" 
                style={{ width: `${(metrics.nuevos / (metrics.nuevos + metrics.recurrentes)) * 100}%` }}
              >
                {metrics.nuevos > 0 && `${Math.round((metrics.nuevos / (metrics.nuevos + metrics.recurrentes)) * 100)}%`}
              </div>
              <div 
                className="bg-accent flex items-center justify-center text-[10px] font-black text-black" 
                style={{ width: `${(metrics.recurrentes / (metrics.nuevos + metrics.recurrentes)) * 100}%` }}
              >
                {metrics.recurrentes > 0 && `${Math.round((metrics.recurrentes / (metrics.nuevos + metrics.recurrentes)) * 100)}%`}
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest px-1">
              <span>{metrics.nuevos} Clientes Nuevos</span>
              <span>{metrics.recurrentes} Clientes Recurrentes</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted text-xs italic py-4">Sin datos de actividad.</p>
        )}
      </div>

      {/* Listado de clientes actual (con filtros) */}
      <div className="space-y-4 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Listado General</h3>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">
              Mostrando {filteredList.length} de {clientes.length} clientes
            </div>
          </div>

          {/* Filtros de Listado */}
          <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
            <button 
              onClick={() => setFilterType("todos")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === 'todos' ? 'bg-white text-black' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType("recurrentes")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === 'recurrentes' ? 'bg-white text-black' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              Recurrentes
            </button>
            <button 
              onClick={() => setFilterType("nuevos")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === 'nuevos' ? 'bg-white text-black' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              Nuevos
            </button>
            
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block"></div>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-muted hover:text-white focus:outline-none cursor-pointer px-3 py-1.5"
            >
              <option value="" className="bg-card-bg">Filtrar Etiqueta</option>
              {allAvailableTags.map(tag => (
                <option key={tag} value={tag} className="bg-card-bg">{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card-bg p-12 text-center">
            <p className="text-muted italic">No se encontraron clientes con los criterios seleccionados.</p>
          </div>
        ) : (
          <div className="hidden md:block overflow-x-auto rounded-xl border border-card-border bg-card-bg shadow-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-widest text-muted/50">
                  <th className="px-6 py-5 font-bold">Información del Cliente</th>
                  <th className="px-6 py-5 font-bold">Contacto</th>
                  <th className="px-6 py-5 font-bold text-center">Reservas Totales</th>
                  <th className="px-6 py-5 font-bold text-right">Importe Total</th>
                  <th className="px-6 py-5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-white/[0.03]">
                    <td className="px-6 py-5">
                      <Link href={`/admin/clientes/${c.id}`} className="text-base font-black text-white hover:text-accent transition-colors flex flex-col">
                        {c.nombre}
                      </Link>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.total_reservas > 1 && (
                          <StatusBadge type="cliente" value="recurrente" />
                        )}
                        {(c.etiquetas || []).map(tag => (
                          <span key={tag} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">
                            {tag}
                          </span>
                        ))}
                        {(!c.etiquetas || c.etiquetas.length === 0) && (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-muted border border-white/5 italic">
                            Sin etiquetas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-muted">
                      {c.email || c.telefono || "—"}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-lg font-black text-white">{c.total_reservas}</span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-accent">
                      {formatCurrency(c.importe_total)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/admin/clientes/${c.id}`} className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        Ver Ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vista móvil */}
        <div className="grid gap-4 md:hidden pb-12">
          {filteredList.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/5 bg-card-bg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <Link href={`/admin/clientes/${c.id}`} className="text-lg font-black text-white hover:text-accent truncate">
                  {c.nombre}
                </Link>
                <span className="text-lg font-black text-accent">{formatCurrency(c.importe_total)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                <div className="flex gap-2">
                  <span className="text-muted">{c.total_reservas} RESERVAS</span>
                  {c.total_reservas > 1 && (
                    <span className="text-accent flex items-center gap-1">
                      <RefreshCw className="w-2 h-2" /> RECURRENTE
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(c.etiquetas || []).slice(0, 2).map(tag => (
                    <span key={tag} className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full text-[7px] border border-blue-500/20">
                      {tag}
                    </span>
                  ))}
                  {(c.etiquetas || []).length > 2 && (
                    <span className="text-[7px] text-muted flex items-center">+{c.etiquetas.length - 2}</span>
                  )}
                </div>
                <Link href={`/admin/clientes/${c.id}`} className="text-white bg-white/5 px-2 py-1 rounded">DETALLE</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
