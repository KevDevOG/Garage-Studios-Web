"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  FinanceMovement,
  FinanceYearlySummary,
  FinanceAnnualInsights,
  deleteFinanceMovement,
} from "@/app/actions/finanzas";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  CreditCard,
  Printer,
  Calendar,
  Download,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatIsoDateEs, getZonedParts } from "@/lib/dates";

interface FinanzasClientProps {
  view: "mensual" | "anual";
  month: number;
  year: number;
  summary: { ingresos: number; gastos: number; beneficio: number; count: number; ticketMedio: number } | null;
  movements: FinanceMovement[];
  annualSummary: FinanceYearlySummary | null;
  annualInsights: FinanceAnnualInsights | null;
}

const RESERVA_PREFIX = "reserva-";
const EMPTY_SUMMARY = { ingresos: 0, gastos: 0, beneficio: 0, count: 0, ticketMedio: 0 };

const pad = (n: number) => String(n).padStart(2, "0");

export default function FinanzasClient({
  view,
  month,
  year,
  summary: summaryProp,
  movements,
  annualSummary,
  annualInsights,
}: FinanzasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "gasto">("todos");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const summary = summaryProp ?? EMPTY_SUMMARY;

  const handleViewChange = (newView: "mensual" | "anual") => {
    router.push(`/admin/finanzas?view=${newView}&month=${month}&year=${year}`);
  };

  const handleMonthChange = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    else if (newMonth < 1) { newMonth = 12; newYear--; }
    router.push(`/admin/finanzas?month=${newMonth}&year=${newYear}`);
  };

  const goToYear = (newYear: number) => {
    router.push(`/admin/finanzas?view=anual&month=${month}&year=${newYear}`);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteFinanceMovement(id);
        if (!res.ok) {
          toast.error(res.error);
        } else {
          toast.success("Movimiento eliminado");
          router.refresh();
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo eliminar el movimiento. Inténtalo de nuevo.");
      } finally {
        setConfirmingId(null);
      }
    });
  };

  const filteredMovements = movements.filter((m) => (filterTipo === "todos" ? true : m.tipo === filterTipo));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
  const monthName = formatIsoDateEs(`${year}-${pad(month)}-01`, { month: "long", year: "numeric" });
  const monthLabel = (m: number, style: "long" | "short") =>
    formatIsoDateEs(`${year}-${pad(m)}-01`, { month: style });

  const currentStudioYear = getZonedParts().year;
  const firstYear = Math.min(2025, year);
  const lastYear = Math.max(currentStudioYear + 1, year);
  const yearOptions = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);

  // Escala del gráfico anual: el mayor importe mensual (ingresos o gastos).
  const chartMax = annualSummary
    ? Math.max(...annualSummary.evolution.flatMap((s) => [s.ingresos, s.gastos]), 1)
    : 1;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card-bg p-4 rounded-xl border border-card-border">
        <div className="flex items-center bg-white/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleViewChange("mensual")}
            aria-pressed={view === "mensual"}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === "mensual" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-muted hover:text-white"}`}
          >
            Vista Mensual
          </button>
          <button
            type="button"
            onClick={() => handleViewChange("anual")}
            aria-pressed={view === "anual"}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === "anual" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-muted hover:text-white"}`}
          >
            Vista Anual
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/admin/finanzas/informe?month=${month}&year=${year}`}
            target="_blank"
            className="hidden sm:flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wide text-xs hover:bg-white/20 transition-all border border-white/10"
          >
            <Printer className="w-3 h-3" aria-hidden="true" />
            Informe PDF
          </Link>
          <Link href="/admin/finanzas/nuevo" className="bg-accent text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wide text-sm hover:scale-105 transition-transform shadow-lg shadow-accent/10">
            + Nuevo Movimiento
          </Link>
        </div>
      </div>

      {view === "mensual" ? (
        <>
          {/* Controles de Mes */}
          <div className="flex justify-center items-center gap-4 sm:gap-6 py-2">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              aria-label="Mes anterior"
              className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <h2 className="text-xl font-black capitalize text-center min-w-0 sm:min-w-[200px] italic tracking-tighter">
              {monthName}
            </h2>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              aria-label="Mes siguiente"
              className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* KPIs Mensuales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border group hover:border-green-500/30 transition-colors">
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-400" aria-hidden="true" /> Ingresos
              </p>
              <p className="text-2xl font-black text-green-400">{formatCurrency(summary.ingresos)}</p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border group hover:border-red-500/30 transition-colors">
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-red-400" aria-hidden="true" /> Gastos
              </p>
              <p className="text-2xl font-black text-red-400">{formatCurrency(summary.gastos)}</p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-accent/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors"></div>
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 relative z-10">Beneficio Neto</p>
              <p className={`text-2xl font-black relative z-10 ${summary.beneficio >= 0 ? "text-accent" : "text-red-400"}`}>
                {formatCurrency(summary.beneficio)}
              </p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Ticket Medio</p>
                <p className="text-xl font-bold">{formatCurrency(summary.ticketMedio)}</p>
              </div>
              <p className="text-[10px] text-muted mt-2 font-bold uppercase">{summary.count} movimientos</p>
            </div>
          </div>

          {/* Listado de Movimientos */}
          <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-card-border bg-black/40 gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" /> Movimientos del mes
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Filtrar por tipo de movimiento"
                  value={filterTipo}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFilterTipo(v === "ingreso" || v === "gasto" ? v : "todos");
                  }}
                  className="text-xs py-2 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none transition-all"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="gasto">Gastos</option>
                </select>
                <Link
                  href="/admin/exportaciones"
                  className="text-xs bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl font-bold border border-white/5 flex items-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Exportar
                </Link>
              </div>
            </div>

            {filteredMovements.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="text-muted text-sm italic font-medium">No hay movimientos para este periodo.</div>
                <Link href="/admin/finanzas/nuevo" className="inline-block text-xs text-accent font-bold uppercase border-b border-accent/30 hover:border-accent pb-0.5 transition-all">Registrar primer movimiento</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredMovements.map((mov) => {
                  const isReservaRow = mov.id.startsWith(RESERVA_PREFIX);
                  const isConfirming = confirmingId === mov.id;
                  return (
                    <div key={mov.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex gap-4 items-start min-w-0">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${mov.tipo === "ingreso" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"}`}></div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-base leading-tight group-hover:text-accent transition-colors break-words">{mov.concepto}</p>
                          <div className="text-[10px] sm:text-xs text-muted flex flex-wrap items-center gap-2 mt-2 font-bold uppercase tracking-tighter">
                            <span>{formatIsoDateEs(mov.fecha, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                            <span className="text-white/10">•</span>
                            <span className="text-accent/80">{mov.categoria}</span>
                            {mov.metodo_pago && (
                              <>
                                <span className="text-white/10">•</span>
                                <StatusBadge type="pago" value={mov.metodo_pago} />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <p className={`font-black text-lg ${mov.tipo === "ingreso" ? "text-green-400" : "text-red-400"}`}>
                          {mov.tipo === "ingreso" ? "+" : "-"}{formatCurrency(mov.importe)}
                        </p>
                        <div className="flex items-center gap-2">
                          {isReservaRow ? (
                            mov.reserva_id && (
                              <Link
                                href={`/admin/calendario/${mov.reserva_id}`}
                                aria-label={`Ver la reserva de ${mov.concepto}`}
                                title="Ver reserva"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                              </Link>
                            )
                          ) : isConfirming ? (
                            <span className="inline-flex items-center gap-3 text-xs">
                              <span className="text-muted">¿Eliminar?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(mov.id)}
                                disabled={isPending}
                                className="font-bold text-red-500 hover:text-red-400 hover:underline disabled:opacity-50"
                              >
                                {isPending ? "Eliminando..." : "Sí"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                disabled={isPending}
                                className="text-muted hover:text-white hover:underline disabled:opacity-50"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <>
                              <Link
                                href={`/admin/finanzas/${mov.id}`}
                                aria-label={`Editar ${mov.concepto}`}
                                title="Editar"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5"
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(mov.id)}
                                aria-label={`Eliminar ${mov.concepto}`}
                                title="Eliminar"
                                className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 transition-all border border-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* VISTA ANUAL */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Selector de año */}
          <div className="flex justify-center items-center gap-4 sm:gap-6 py-2">
            <button
              type="button"
              onClick={() => goToYear(year - 1)}
              aria-label="Año anterior"
              className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <label htmlFor="finanzas-year" className="sr-only">Año</label>
              <select
                id="finanzas-year"
                value={year}
                onChange={(e) => goToYear(Number(e.target.value))}
                className="text-xl font-black italic tracking-tighter bg-transparent text-white focus:outline-none cursor-pointer hover:text-accent transition-colors text-center"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="bg-card-bg text-white">{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => goToYear(year + 1)}
              aria-label="Año siguiente"
              className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {!annualSummary || !annualInsights ? (
            <div className="py-20 text-center text-muted text-sm italic">No hay datos para este año.</div>
          ) : (
            <>
              {/* KPIs Anuales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-card-bg to-black p-6 rounded-2xl border border-card-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-16 h-16 text-green-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Ingresos Totales {year}</p>
                  <p className="text-3xl sm:text-4xl font-black text-green-400 tracking-tighter">{formatCurrency(annualSummary.ingresosTotal)}</p>
                  <p className="text-[10px] text-muted mt-4 font-bold uppercase">{annualSummary.movimientosCount} transacciones registradas</p>
                </div>

                <div className="bg-gradient-to-br from-card-bg to-black p-6 rounded-2xl border border-card-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDown className="w-16 h-16 text-red-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Gastos Totales {year}</p>
                  <p className="text-3xl sm:text-4xl font-black text-red-400 tracking-tighter">{formatCurrency(annualSummary.gastosTotal)}</p>
                  <p className="text-[10px] text-muted mt-4 font-bold uppercase">Cierre de ejercicio</p>
                </div>

                <div className="bg-gradient-to-br from-accent/10 via-card-bg to-black p-6 rounded-2xl border border-accent/30 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="w-16 h-16 text-accent" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Beneficio Anual</p>
                  <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${annualSummary.beneficioTotal >= 0 ? "text-accent" : "text-red-400"}`}>
                    {formatCurrency(annualSummary.beneficioTotal)}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] text-muted font-bold uppercase">Ticket Medio:</span>
                    <span className="text-xs font-black text-white">{formatCurrency(annualSummary.ticketMedio)}</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Evolución Mensual */}
              <div className="bg-card-bg p-4 sm:p-8 rounded-3xl border border-card-border shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-10 gap-4">
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Evolución del Negocio</h3>
                    <p className="text-xs text-muted font-medium">Comparativa mensual de ingresos y gastos durante el {year}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-3 h-3 bg-green-400 rounded shadow-[0_0_8px_rgba(74,222,128,0.4)]"></div>
                      <span className="text-muted">Ingresos</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-3 h-3 bg-red-400 rounded shadow-[0_0_8px_rgba(248,113,113,0.4)]"></div>
                      <span className="text-muted">Gastos</span>
                    </div>
                  </div>
                </div>

                <div className="relative h-64 flex items-end justify-between gap-1 sm:gap-2 px-0 sm:px-2">
                  {annualSummary.evolution.map((stat, idx) => {
                    const incomeH = (stat.ingresos / chartMax) * 100;
                    const expH = (stat.gastos / chartMax) * 100;
                    const label = monthLabel(stat.mes, "long");

                    return (
                      <div
                        key={stat.mes}
                        role="img"
                        aria-label={`${label}: ingresos ${formatCurrency(stat.ingresos)}, gastos ${formatCurrency(stat.gastos)}`}
                        className="flex flex-col items-center flex-1 group relative h-full justify-end"
                      >
                        <div className="w-full flex flex-col gap-0.5 items-center justify-end h-full">
                          <div
                            className="w-full max-w-[12px] bg-green-400/30 group-hover:bg-green-400 transition-all rounded-full shadow-lg"
                            style={{ height: `${incomeH}%` }}
                          ></div>
                          <div
                            className="w-full max-w-[12px] bg-red-400/30 group-hover:bg-red-400 transition-all rounded-full shadow-lg"
                            style={{ height: `${expH}%` }}
                          ></div>
                        </div>
                        {/* Tooltip */}
                        <div className={`absolute bottom-full mb-4 bg-black/95 backdrop-blur-md border border-white/10 text-[10px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-all transform translate-y-2 group-hover:translate-y-0 min-w-[140px] ${idx > 8 ? "right-0" : idx < 3 ? "left-0" : ""}`}>
                          <p className="font-black text-center uppercase tracking-widest border-b border-white/5 pb-2 mb-2 text-accent">
                            {label}
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between font-bold gap-3">
                              <span className="text-muted">Ingresos:</span>
                              <span className="text-green-400">{formatCurrency(stat.ingresos)}</span>
                            </div>
                            <div className="flex justify-between font-bold gap-3">
                              <span className="text-muted">Gastos:</span>
                              <span className="text-red-400">{formatCurrency(stat.gastos)}</span>
                            </div>
                            <div className="flex justify-between font-black border-t border-white/5 pt-1.5 mt-1 text-[11px] gap-3">
                              <span className="text-muted">Neto:</span>
                              <span className={stat.beneficio >= 0 ? "text-accent" : "text-red-500"}>{formatCurrency(stat.beneficio)}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted/60 mt-4 font-black uppercase tracking-widest group-hover:text-white transition-colors">
                          {monthLabel(stat.mes, "short").replace(".", "").substring(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights Anuales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <TrendingUp className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Mejor Mes</p>
                    <p className="text-sm font-black text-white capitalize">
                      {annualSummary.bestMonth ? monthLabel(annualSummary.bestMonth.mes, "long") : "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <Award className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Servicio Estrella</p>
                    <p className="text-sm font-black text-white truncate">{annualInsights.topService?.[0] || "—"}</p>
                  </div>
                </div>

                <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <Users className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Mejor Cliente</p>
                    <p className="text-sm font-black text-white truncate">{annualInsights.topClient?.[0] || "—"}</p>
                  </div>
                </div>

                <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent">
                    <CreditCard className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Método Preferido</p>
                    <p className="text-sm font-black text-white capitalize truncate">{annualInsights.mostUsedPaymentMethod?.[0] || "—"}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
