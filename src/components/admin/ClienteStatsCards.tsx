"use client";

import { CommercialStats } from "@/app/actions/clientes";
import { 
  Euro, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Star,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface ClienteStatsCardsProps {
  stats: CommercialStats;
}

export default function ClienteStatsCards({ stats }: ClienteStatsCardsProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      
      {/* Total Pagado */}
      <div className="bg-card-bg p-5 rounded-2xl border border-card-border shadow-lg border-l-green-500/30">
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <Euro className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Total Pagado</span>
        </div>
        <p className="text-2xl font-black text-white truncate">
          {formatCurrency(stats.totalPagado)}
        </p>
        <p className="text-[9px] text-muted font-bold uppercase mt-1 tracking-tighter">
          Dinero real cobrado
        </p>
      </div>

      {/* Importe Pendiente */}
      <div className={`bg-card-bg p-5 rounded-2xl border border-card-border shadow-lg ${stats.importePendiente > 0 ? 'border-l-amber-500/50' : ''}`}>
        <div className={`flex items-center gap-2 mb-2 ${stats.importePendiente > 0 ? 'text-amber-400' : 'text-muted'}`}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Pendiente</span>
        </div>
        <p className={`text-2xl font-black truncate ${stats.importePendiente > 0 ? 'text-white' : 'text-muted/30'}`}>
          {formatCurrency(stats.importePendiente)}
        </p>
        <p className="text-[9px] text-muted font-bold uppercase mt-1 tracking-tighter">
          Reservas por cobrar
        </p>
      </div>

      {/* Ticket Medio */}
      <div className="bg-card-bg p-5 rounded-2xl border border-card-border shadow-lg">
        <div className="flex items-center gap-2 text-accent mb-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Ticket Medio</span>
        </div>
        <p className="text-2xl font-black text-white truncate">
          {formatCurrency(stats.ticketMedioReal)}
        </p>
        <p className="text-[9px] text-muted font-bold uppercase mt-1 tracking-tighter">
          Promedio por cobro
        </p>
      </div>

      {/* Servicio Favorito */}
      <div className="bg-card-bg p-5 rounded-2xl border border-card-border shadow-lg">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <Star className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Favorito</span>
        </div>
        <p className="text-sm font-black text-white line-clamp-1 h-8 flex items-center">
          {stats.servicioFavorito}
        </p>
        <p className="text-[9px] text-muted font-bold uppercase mt-1 tracking-tighter">
          Más contratado
        </p>
      </div>

      {/* Reservas Status */}
      <div className="col-span-2 md:col-span-4 grid grid-cols-4 gap-4 pt-2">
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-lg font-black text-white">{stats.totalReservas}</span>
          <span className="text-[8px] font-black uppercase text-muted tracking-widest">Total</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-lg font-black text-green-400">{stats.completadas}</span>
          <span className="text-[8px] font-black uppercase text-muted tracking-widest">Completadas</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-lg font-black text-amber-400">{stats.pendientes}</span>
          <span className="text-[8px] font-black uppercase text-muted tracking-widest">Pendientes</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
          <span className="text-lg font-black text-red-400">{stats.canceladas}</span>
          <span className="text-[8px] font-black uppercase text-muted tracking-widest">Canceladas</span>
        </div>
      </div>

      {/* Fechas */}
      <div className="col-span-2 bg-card-bg p-4 rounded-2xl border border-card-border shadow-lg flex items-center gap-4">
        <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Última Reserva</p>
          <p className="text-sm font-bold text-white">
            {stats.ultimaReserva ? new Date(stats.ultimaReserva + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric'}) : "Sin historial"}
          </p>
        </div>
      </div>

      <div className="col-span-2 bg-card-bg p-4 rounded-2xl border border-card-border shadow-lg flex items-center gap-4 border-l-accent/30">
        <div className="p-3 rounded-full bg-accent/10 text-accent">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Próxima Reserva</p>
          <p className="text-sm font-bold text-white">
            {stats.proximaReserva ? new Date(stats.proximaReserva + "T00:00:00").toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric'}) : "No hay programadas"}
          </p>
        </div>
      </div>

    </div>
  );
}
