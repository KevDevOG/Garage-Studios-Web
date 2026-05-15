"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FinanceMovement, deleteFinanceMovement } from "@/app/actions/finanzas";
import ExcelJS from "exceljs";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Users, 
  CreditCard,
  Printer,
  Calendar
} from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";

interface FinanzasClientProps {
  view: "mensual" | "anual";
  month: number;
  year: number;
  summary: { ingresos: number; gastos: number; beneficio: number; count: number; ticketMedio: number };
  movements: FinanceMovement[];
  yearlyStats: {
    monthlyStats: { ingresos: number; gastos: number; beneficio: number }[];
    categoryStats: Record<string, number>;
  };
  annualSummary: any;
  annualInsights: any;
}

export default function FinanzasClient({ 
  view, 
  month, 
  year, 
  summary, 
  movements, 
  yearlyStats,
  annualSummary,
  annualInsights
}: FinanzasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "gasto">("todos");

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

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    startTransition(async () => {
      await deleteFinanceMovement(id);
    });
  };

  const filteredMovements = movements.filter(m => filterTipo === "todos" ? true : m.tipo === filterTipo);

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  const monthName = new Date(year, month - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Garage Studios Admin";
    workbook.lastModifiedBy = "Garage Studios Admin";
    workbook.created = new Date();

    // --- HOJA 1: RESUMEN ---
    const sheetResumen = workbook.addWorksheet("Resumen", {
      views: [{ showGridLines: false }]
    });

    // Título
    sheetResumen.mergeCells("B2:F2");
    const titleCell = sheetResumen.getCell("B2");
    titleCell.value = "FINANZAS GARAGE STUDIOS";
    titleCell.font = { name: "Arial Black", size: 16, color: { argb: "FF000000" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    sheetResumen.mergeCells("B3:F3");
    const subtitleCell = sheetResumen.getCell("B3");
    subtitleCell.value = `${monthName.toUpperCase()}`;
    subtitleCell.font = { size: 12, bold: true, color: { argb: "FF666666" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };

    // KPI Cards en el Excel
    const kpis = [
      ["Ingresos Totales", summary.ingresos, "FF22C55E"],
      ["Gastos Totales", summary.gastos, "FFEF4444"],
      ["Beneficio Neto", summary.beneficio, summary.beneficio >= 0 ? "FFF59E0B" : "FFEF4444"],
      ["Nº Movimientos", summary.count, "FF3B82F6"],
      ["Ticket Medio", summary.ticketMedio, "FF8B5CF6"]
    ];

    kpis.forEach((kpi, i) => {
      const row = 5 + i;
      sheetResumen.getCell(`B${row}`).value = kpi[0];
      sheetResumen.getCell(`B${row}`).font = { bold: true };
      
      const valCell = sheetResumen.getCell(`C${row}`);
      valCell.value = kpi[1];
      valCell.numFmt = kpi[0] === "Nº Movimientos" ? "0" : "#,##0.00\" €\"";
      valCell.font = { bold: true, color: { argb: kpi[2] as string } };
    });

    // Resumen por Categorías en Hoja 1
    sheetResumen.getCell("B12").value = "RESUMEN POR CATEGORÍAS (AÑO)";
    sheetResumen.getCell("B12").font = { bold: true, size: 11 };
    
    const catHeader = ["Categoría", "Importe", "Visual"];
    sheetResumen.getRow(13).values = [null, ...catHeader];
    sheetResumen.getRow(13).font = { bold: true };
    sheetResumen.getRow(13).alignment = { horizontal: "center" };

    const sortedCats = Object.entries(yearlyStats.categoryStats).sort((a,b) => b[1] - a[1]);
    const maxCat = Math.max(...Object.values(yearlyStats.categoryStats), 1);

    sortedCats.forEach(([cat, val], i) => {
      const row = 14 + i;
      sheetResumen.getCell(`B${row}`).value = cat;
      sheetResumen.getCell(`C${row}`).value = val;
      sheetResumen.getCell(`C${row}`).numFmt = "#,##0.00\" €\"";
      
      // Representación visual simple con caracteres o relleno de celda
      const visualWidth = Math.round((val / maxCat) * 10);
      sheetResumen.getCell(`D${row}`).value = "█".repeat(visualWidth);
      sheetResumen.getCell(`D${row}`).font = { color: { argb: "FFF59E0B" } };
    });

    sheetResumen.getColumn("B").width = 25;
    sheetResumen.getColumn("C").width = 15;
    sheetResumen.getColumn("D").width = 20;

    // --- HOJA 2: MOVIMIENTOS ---
    const sheetMovs = workbook.addWorksheet("Detalle Movimientos");
    
    const headers = ["Fecha", "Tipo", "Categoría", "Concepto", "Importe", "Método Pago", "Notas"];
    sheetMovs.getRow(1).values = headers;
    sheetMovs.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheetMovs.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" }
    };
    sheetMovs.getRow(1).alignment = { horizontal: "center" };

    filteredMovements.forEach((m, i) => {
      const row = sheetMovs.getRow(i + 2);
      const isIngreso = m.tipo === "ingreso";
      
      row.values = [
        new Date(m.fecha),
        m.tipo.toUpperCase(),
        m.categoria,
        m.concepto,
        isIngreso ? m.importe : -m.importe,
        m.metodo_pago ? m.metodo_pago.toUpperCase() : "-",
        m.notas || ""
      ];

      // Formato fecha
      row.getCell(1).numFmt = "dd/mm/yyyy";
      
      // Formato importe y color
      const importeCell = row.getCell(5);
      importeCell.numFmt = "#,##0.00\" €\"";
      importeCell.font = {
        color: { argb: isIngreso ? "FF22C55E" : "FFEF4444" },
        bold: true
      };
    });

    // Auto-filtros y Congelar panel
    sheetMovs.autoFilter = "A1:G1";
    sheetMovs.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // Ancho automático (basado en el contenido aprox)
    sheetMovs.columns.forEach(column => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLen) maxLen = len;
      });
      column.width = Math.min(Math.max(maxLen + 2, 10), 50);
    });

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzas-garage-studios-${monthName.toLowerCase().replace(/ /g, "-")}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calcular maximos para graficos
  const maxCategory = Math.max(...Object.values(yearlyStats.categoryStats), 1);
  const maxMonthIncome = Math.max(...yearlyStats.monthlyStats.map(s => s.ingresos), 1);
  const maxMonthExpense = Math.max(...yearlyStats.monthlyStats.map(s => s.gastos), 1);
  const maxMonthVal = Math.max(maxMonthIncome, maxMonthExpense);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card-bg p-4 rounded-xl border border-card-border">
        <div className="flex items-center bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => handleViewChange("mensual")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'mensual' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-muted hover:text-white'}`}
          >
            Vista Mensual
          </button>
          <button 
            onClick={() => handleViewChange("anual")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'anual' ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'text-muted hover:text-white'}`}
          >
            Vista Anual
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href={`/admin/finanzas/informe?month=${month}&year=${year}`} 
            target="_blank"
            className="hidden sm:flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wide text-xs hover:bg-white/20 transition-all border border-white/10"
          >
            <Printer className="w-3 h-3" />
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
          <div className="flex justify-center items-center gap-6 py-2">
            <button onClick={() => handleMonthChange(-1)} className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black capitalize text-center min-w-[200px] italic tracking-tighter">
              {monthName}
            </h2>
            <button onClick={() => handleMonthChange(1)} className="p-2 bg-white/5 rounded-full hover:bg-accent hover:text-black transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* KPIs Mensuales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border group hover:border-green-500/30 transition-colors">
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-green-400" /> Ingresos
              </p>
              <p className="text-2xl font-black text-green-400">{formatCurrency(summary.ingresos)}</p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border group hover:border-red-500/30 transition-colors">
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                <TrendingDown className="w-3 h-3 text-red-400" /> Gastos
              </p>
              <p className="text-2xl font-black text-red-400">{formatCurrency(summary.gastos)}</p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-accent/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors"></div>
              <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-2 relative z-10">Beneficio Neto</p>
              <p className={`text-2xl font-black relative z-10 ${summary.beneficio >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {formatCurrency(summary.beneficio)}
              </p>
            </div>
            <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Ticket Medio</p>
                <p className="text-xl font-bold">{formatCurrency(summary.ticketMedio)}</p>
              </div>
              <p className="text-[9px] text-muted mt-2 font-bold uppercase">{summary.count} movimientos</p>
            </div>
          </div>

          {/* Listado de Movimientos (Existente) */}
          <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-card-border bg-black/40 gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Movimientos del mes
              </h3>
              <div className="flex items-center gap-3">
                <select 
                  value={filterTipo} 
                  onChange={(e) => setFilterTipo(e.target.value as any)}
                  className="text-xs py-2 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none transition-all"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="gasto">Gastos</option>
                </select>
                <button 
                  onClick={exportExcel} 
                  className="text-xs bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl font-bold border border-white/5 flex items-center gap-2 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Exportar
                </button>
              </div>
            </div>
            
            {filteredMovements.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="text-muted text-sm italic font-medium">No hay movimientos para este periodo.</div>
                <Link href="/admin/finanzas/nuevo" className="inline-block text-xs text-accent font-bold uppercase border-b border-accent/30 hover:border-accent pb-0.5 transition-all">Registrar primer movimiento</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredMovements.map((mov) => (
                  <div key={mov.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex gap-4 items-start">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${mov.tipo === 'ingreso' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}></div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-base leading-tight group-hover:text-accent transition-colors">{mov.concepto}</p>
                        <div className="text-[10px] sm:text-xs text-muted flex flex-wrap items-center gap-2 mt-2 font-bold uppercase tracking-tighter">
                          <span>{new Date(mov.fecha).toLocaleDateString('es-ES')}</span>
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
                      <p className={`font-black text-lg ${mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.importe)}
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/admin/finanzas/${mov.id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all border border-white/5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button 
                          onClick={() => handleDelete(mov.id)} 
                          className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/20 text-red-500/60 hover:text-red-500 transition-all border border-red-500/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* VISTA ANUAL */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* KPIs Anuales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-card-bg to-black p-6 rounded-2xl border border-card-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-green-400" />
              </div>
              <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Ingresos Totales {year}</p>
              <p className="text-4xl font-black text-green-400 tracking-tighter">{formatCurrency(annualSummary.ingresosTotal)}</p>
              <p className="text-[10px] text-muted mt-4 font-bold uppercase">{annualSummary.movimientosCount} transacciones registradas</p>
            </div>
            
            <div className="bg-gradient-to-br from-card-bg to-black p-6 rounded-2xl border border-card-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown className="w-16 h-16 text-red-400" />
              </div>
              <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Gastos Totales {year}</p>
              <p className="text-4xl font-black text-red-400 tracking-tighter">{formatCurrency(annualSummary.gastosTotal)}</p>
              <p className="text-[10px] text-muted mt-4 font-bold uppercase">Cierre de ejercicio</p>
            </div>

            <div className="bg-gradient-to-br from-accent/10 via-card-bg to-black p-6 rounded-2xl border border-accent/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-accent" />
              </div>
              <p className="text-xs text-muted font-black uppercase tracking-widest mb-2">Beneficio Anual</p>
              <p className={`text-4xl font-black tracking-tighter ${annualSummary.beneficioTotal >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {formatCurrency(annualSummary.beneficioTotal)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] text-muted font-bold uppercase">Ticket Medio:</span>
                <span className="text-xs font-black text-white">{formatCurrency(annualSummary.ticketMedio)}</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolución Mensual */}
          <div className="bg-card-bg p-8 rounded-3xl border border-card-border shadow-2xl">
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

            <div className="relative h-64 flex items-end justify-between gap-2 px-2">
              {annualSummary.evolution.map((stat: any, idx: number) => {
                const maxVal = Math.max(annualSummary.ingresosTotal / 4, annualSummary.gastosTotal / 4, 1000); // Normalización visual
                const incomeH = Math.min((stat.ingresos / maxVal) * 100, 100);
                const expH = Math.min((stat.gastos / maxVal) * 100, 100);
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end">
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
                    <div className="absolute bottom-full mb-4 bg-black/95 backdrop-blur-md border border-white/10 text-[10px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-all transform translate-y-2 group-hover:translate-y-0 min-w-[140px]">
                      <p className="font-black text-center uppercase tracking-widest border-b border-white/5 pb-2 mb-2 text-accent">
                        {new Date(year, idx).toLocaleString('es-ES', { month: 'long' })}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-bold">
                          <span className="text-muted">Ingresos:</span>
                          <span className="text-green-400">{formatCurrency(stat.ingresos)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-muted">Gastos:</span>
                          <span className="text-red-400">{formatCurrency(stat.gastos)}</span>
                        </div>
                        <div className="flex justify-between font-black border-t border-white/5 pt-1.5 mt-1 text-[11px]">
                          <span className="text-muted">Neto:</span>
                          <span className={stat.beneficio >= 0 ? 'text-accent' : 'text-red-500'}>{formatCurrency(stat.beneficio)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted/60 mt-4 font-black uppercase tracking-widest group-hover:text-white transition-colors">
                      {new Date(year, idx).toLocaleString('es-ES', { month: 'short' }).substring(0, 3)}
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
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Mejor Mes</p>
                <p className="text-sm font-black text-white capitalize">{annualSummary.bestMonth.mes ? new Date(year, annualSummary.bestMonth.mes - 1).toLocaleString('es-ES', { month: 'long' }) : '--'}</p>
              </div>
            </div>

            <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Servicio Estrella</p>
                <p className="text-sm font-black text-white truncate">{annualInsights.topService?.[0] || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Mejor Cliente</p>
                <p className="text-sm font-black text-white truncate">{annualInsights.topClient?.[0] || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-card-bg p-5 rounded-2xl border border-card-border flex items-center gap-4 group hover:border-accent/30 transition-colors">
              <div className="p-3 rounded-xl bg-accent/10 text-accent">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-1">Método Preferido</p>
                <p className="text-sm font-black text-white capitalize">{annualInsights.mostUsedPaymentMethod?.[0] || 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
