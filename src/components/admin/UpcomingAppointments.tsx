import Link from "next/link";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";

interface UpcomingAppointmentsProps {
  reservations: any[];
}

export default function UpcomingAppointments({ reservations }: UpcomingAppointmentsProps) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-accent" />
          Próximas Citas
        </h3>
        <Link 
          href="/admin/calendario" 
          className="text-xs font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1 group"
        >
          Ver Calendario
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {reservations.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted italic">No hay próximas citas programadas.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const date = new Date(res.fecha_reserva + "T00:00:00");
            return (
              <div 
                key={res.id} 
                className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-accent"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center min-w-[50px]">
                    <span className="text-xs font-bold text-muted uppercase">{date.toLocaleDateString("es-ES", { month: 'short' })}</span>
                    <span className="text-lg font-black text-white leading-none">{date.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate">{res.nombre}</div>
                    <div className="text-[10px] text-muted truncate">
                      {res.hora_inicio?.slice(0, 5)} • {res.servicio?.nombre}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    res.estado === 'confirmada' ? 'border-green-500/20 text-green-400 bg-green-500/5' : 
                    res.estado === 'pendiente' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-white/10 text-muted'
                  }`}>
                    {res.estado}
                  </div>
                  {res.estado_pago && (
                    <div className={`text-[7px] font-black uppercase px-1.5 py-0 rounded border ${
                      res.estado_pago === 'pagado' ? 'border-green-500/20 text-green-400/80 bg-green-500/5' :
                      res.estado_pago === 'parcial' ? 'border-blue-500/20 text-blue-400/80 bg-blue-500/5' :
                      'border-amber-500/20 text-amber-400/80 bg-amber-500/5'
                    }`}>
                      {res.estado_pago === 'pagado' ? 'Pagado' : 
                       res.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
