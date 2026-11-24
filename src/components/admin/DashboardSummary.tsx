"use client";

import { Calendar, MessageSquare, AlertCircle, Wallet, TrendingUp } from "lucide-react";

interface SummaryStats {
  hoy: number;
  mensajes: number;
  pendientesPago: number;
  ingresosMes: number | null;
  emailErrors: number;
}

export default function DashboardSummary({ stats }: { stats: SummaryStats }) {
  const isRevenueUnavailable = stats.ingresosMes === null;

  const items = [
    { label: "Citas de Hoy", value: stats.hoy, icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/5", unavailable: false },
    { label: "Mensajes", value: stats.mensajes, icon: MessageSquare, color: "text-amber-400", bg: "bg-amber-400/5", unavailable: false },
    { label: "Pagos Pendientes", value: stats.pendientesPago, icon: Wallet, color: "text-red-400", bg: "bg-red-400/5", unavailable: false },
    {
      label: "Ingresos Mes",
      value: isRevenueUnavailable ? "No disponible" : `${stats.ingresosMes}€`,
      icon: TrendingUp,
      color: isRevenueUnavailable ? "text-amber-400" : "text-green-400",
      bg: isRevenueUnavailable ? "bg-amber-400/5" : "bg-green-400/5",
      unavailable: isRevenueUnavailable,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-card-bg shadow-xl`}>
          <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} border border-white/5`}>
            <item.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted">{item.label}</div>
            <div className={item.unavailable ? "text-sm font-bold text-amber-400" : "text-xl font-black text-white"}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
      
      {stats.emailErrors > 0 && (
        <div className="col-span-full bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-tighter">
            Hay {stats.emailErrors} errores en el envío de correos. Revisa la auditoría.
          </p>
        </div>
      )}
    </div>
  );
}
