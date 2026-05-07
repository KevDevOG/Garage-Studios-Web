"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FinanceMovement, deleteFinanceMovement } from "@/app/actions/finanzas";
import ExcelJS from "exceljs";

interface FinanzasClientProps {
  month: number;
  year: number;
  summary: { ingresos: number; gastos: number; beneficio: number; count: number; ticketMedio: number };
  movements: FinanceMovement[];
  yearlyStats: {
    monthlyStats: { ingresos: number; gastos: number; beneficio: number }[];
    categoryStats: Record<string, number>;
  };
}

export default function FinanzasClient({ month, year, summary, movements, yearlyStats }: FinanzasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "gasto">("todos");

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
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card-bg p-4 rounded-xl border border-card-border">
        <div className="flex items-center gap-4">
          <button onClick={() => handleMonthChange(-1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">←</button>
          <h2 className="text-lg font-bold capitalize w-40 text-center">{monthName}</h2>
          <button onClick={() => handleMonthChange(1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">→</button>
        </div>
        <Link href="/admin/finanzas/nuevo" className="bg-accent text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wide text-sm hover:scale-105 transition-transform">
          + Nuevo Movimiento
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card-bg p-4 rounded-xl border border-card-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-2xl font-black text-green-400">{formatCurrency(summary.ingresos)}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Gastos</p>
          <p className="text-2xl font-black text-red-400">{formatCurrency(summary.gastos)}</p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-accent/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/5"></div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1 relative z-10">Beneficio Neto</p>
          <p className={`text-2xl font-black relative z-10 ${summary.beneficio >= 0 ? 'text-accent' : 'text-red-400'}`}>
            {formatCurrency(summary.beneficio)}
          </p>
        </div>
        <div className="bg-card-bg p-4 rounded-xl border border-card-border flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Movimientos</p>
            <p className="text-xl font-bold">{summary.count}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mt-2">Ticket Medio</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.ticketMedio)}</p>
          </div>
        </div>
      </div>

      {/* Graficos Sencillos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barras Anuales */}
        <div className="bg-card-bg p-4 rounded-xl border border-card-border flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-sm font-bold uppercase text-muted">Evolución Anual ({year})</h3>
            {/* Leyenda */}
            <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-muted">Gastos</span>
              </div>
            </div>
          </div>

          <div className="relative h-48 flex items-end justify-between gap-1 px-1">
            {/* Si no hay datos en absoluto */}
            {maxMonthVal <= 1 && yearlyStats.monthlyStats.every(s => s.ingresos === 0 && s.gastos === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted text-xs italic">
                No hay datos todavía para este año.
              </div>
            ) : (
              yearlyStats.monthlyStats.map((stat, idx) => {
                // Altura mínima de 4% si hay datos, máximo 100%
                const incomeH = stat.ingresos > 0 ? Math.max((stat.ingresos / maxMonthVal) * 100, 4) : 0;
                const expH = stat.gastos > 0 ? Math.max((stat.gastos / maxMonthVal) * 100, 4) : 0;
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                    <div className="w-full flex gap-0.5 items-end h-full">
                      <div 
                        className="w-1/2 bg-green-500/40 hover:bg-green-400 transition-all rounded-t-sm" 
                        style={{ height: `${incomeH}%` }}
                      ></div>
                      <div 
                        className="w-1/2 bg-red-500/40 hover:bg-red-400 transition-all rounded-t-sm" 
                        style={{ height: `${expH}%` }}
                      ></div>
                    </div>
                    {/* Tooltip mejorado */}
                    <div className="absolute bottom-full mb-3 bg-black/90 backdrop-blur-sm border border-card-border text-[10px] p-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <p className="font-bold border-b border-white/10 pb-1 mb-1 text-center uppercase tracking-tighter">
                        {new Date(2024, idx).toLocaleString('es-ES', { month: 'long' })}
                      </p>
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted">Ingresos:</span>
                          <span className="text-green-400 font-mono font-bold">{formatCurrency(stat.ingresos)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted">Gastos:</span>
                          <span className="text-red-400 font-mono font-bold">{formatCurrency(stat.gastos)}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-white/10 pt-1 mt-1">
                          <span className="text-muted">Neto:</span>
                          <span className={`font-mono font-bold ${stat.beneficio >= 0 ? 'text-accent' : 'text-red-500'}`}>
                            {formatCurrency(stat.beneficio)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted mt-3 font-bold uppercase tracking-tighter">
                      {new Date(2024, idx).toLocaleString('es-ES', { month: 'short' }).substring(0, 3)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reparto Categorías Anual */}
        <div className="bg-card-bg p-4 rounded-xl border border-card-border overflow-hidden">
          <h3 className="text-sm font-bold uppercase mb-4 text-muted">Volumen por Categoría</h3>
          <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
            {Object.entries(yearlyStats.categoryStats)
              .sort((a,b) => b[1] - a[1])
              .map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{cat}</span>
                  <span className="font-bold">{formatCurrency(val)}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${(val / maxCategory) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {Object.keys(yearlyStats.categoryStats).length === 0 && (
              <p className="text-xs text-muted">Sin datos suficientes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Listado con Filtros y Exportar */}
      <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-card-border bg-black/20 gap-4">
          <h3 className="text-sm font-bold uppercase">Movimientos de {monthName}</h3>
          <div className="flex items-center gap-3">
            <select 
              value={filterTipo} 
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 w-auto"
            >
              <option value="todos">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
            <button 
              onClick={exportExcel} 
              className="text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg font-medium flex items-center gap-2"
              title="Exportar a Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Excel
            </button>
          </div>
        </div>
        
        {filteredMovements.length === 0 ? (
          <p className="p-8 text-center text-muted text-sm">No hay movimientos registrados en este mes con los filtros actuales.</p>
        ) : (
          <div className="divide-y divide-card-border">
            {filteredMovements.map((mov) => (
              <div key={mov.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${mov.tipo === 'ingreso' ? 'hover:bg-green-900/10' : 'hover:bg-red-900/10'}`}>
                <div className="flex gap-4 items-start">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${mov.tipo === 'ingreso' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                  <div>
                    <p className="font-bold text-sm text-white/90">{mov.concepto}</p>
                    <p className="text-xs text-muted flex gap-2 items-center mt-1.5 flex-wrap">
                      <span className="font-medium">{new Date(mov.fecha).toLocaleDateString('es-ES')}</span>
                      <span className="text-white/20">•</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-white/80">{mov.categoria}</span>
                      {mov.metodo_pago && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="capitalize">{mov.metodo_pago}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                  <p className={`font-black text-lg ${mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.importe)}
                  </p>
                  <div className="flex gap-3">
                    <Link href={`/admin/finanzas/${mov.id}`} className="text-xs font-medium text-muted hover:text-white transition-colors underline">
                      Editar
                    </Link>
                    <button 
                      onClick={() => handleDelete(mov.id)} 
                      disabled={isPending}
                      className="text-xs font-medium text-red-400/80 hover:text-red-400 transition-colors underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
