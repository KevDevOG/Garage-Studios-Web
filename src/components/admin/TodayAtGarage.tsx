import { Phone, Mail } from "lucide-react";
import QuickActionButtons from "./QuickActionButtons";

interface TodayAtGarageProps {
  reservations: any[];
}

export default function TodayAtGarage({ reservations }: TodayAtGarageProps) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 mb-8 shadow-lg shadow-accent/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
          Hoy en <span className="text-accent">Garage Studios</span>
        </h2>
        <div className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent animate-pulse">
          EN VIVO
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="py-8 text-center text-muted font-medium italic">
          No hay citas programadas para hoy.
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((res) => (
            <div 
              key={res.id} 
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-black/60 transition-all hover:border-accent/30"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-lg bg-accent/10 border border-accent/20">
                  <span className="text-lg font-black text-accent">{res.hora_inicio?.slice(0, 5)}</span>
                  <span className="text-[10px] font-bold text-muted/80 uppercase">{res.hora_fin?.slice(0, 5)}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-base truncate">{res.nombre}</div>
                  <div className="text-xs text-accent font-medium truncate">{res.servicio?.nombre}</div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {res.telefono}</span>
                    <span className="hidden sm:flex items-center gap-1"><Mail className="h-3 w-3" /> {res.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    res.estado === 'confirmada' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 
                    res.estado === 'pendiente' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-white/10 text-muted'
                  }`}>
                    {res.estado}
                  </div>
                  {res.estado_pago && (
                    <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      res.estado_pago === 'pagado' ? 'border-green-500/20 text-green-400 bg-green-500/10' :
                      res.estado_pago === 'parcial' ? 'border-blue-500/20 text-blue-400 bg-blue-500/10' :
                      'border-amber-500/20 text-amber-400 bg-amber-500/10'
                    }`}>
                      {res.estado_pago === 'pagado' ? 'Pagado' : 
                       res.estado_pago === 'parcial' ? `Parcial: ${res.importe_pagado}€` : 'Pendiente'}
                    </div>
                  )}
                </div>
                <QuickActionButtons id={res.id} currentStatus={res.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
