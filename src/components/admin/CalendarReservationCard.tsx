"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateReservationStatus } from "@/app/actions/admin";
import { deleteReservation, deleteReservationBlock } from "@/app/actions/calendario";
import type { ReservationRow } from "@/app/actions/calendario";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-400",
  confirmada: "bg-green-500/10 text-green-400",
  cancelada: "bg-red-500/10 text-red-400",
  rechazada: "bg-red-500/10 text-red-300",
  completada: "bg-blue-500/10 text-blue-400",
};

export default function CalendarReservationCard({
  reservation: res,
}: {
  reservation: ReservationRow;
}) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (status: string) => {
    startTransition(async () => {
      await updateReservationStatus(res.id, status);
    });
  };

  const handleDelete = () => {
    const message = res.is_block 
      ? "¿Eliminar este bloque del pack? Esta acción es definitiva."
      : "¿Eliminar esta reserva? (borrado lógico)";

    if (!confirm(message)) return;

    startTransition(async () => {
      if (res.is_block) {
        await deleteReservationBlock(res.id);
      } else {
        await deleteReservation(res.id);
      }
    });
  };

  return (
    <div
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:border-accent/30 hover:bg-white/[0.05] sm:flex-row sm:items-center ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* Indicador lateral de estado */}
      <div className={`absolute left-0 top-0 h-full w-1 ${
        res.estado === 'pendiente' ? 'bg-amber-500' : 
        res.estado === 'confirmada' ? 'bg-green-500' : 
        res.estado === 'completada' ? 'bg-blue-500' : 'bg-red-500'
      }`} />

      {/* Bloque de Tiempo */}
      <div className="flex flex-col items-start sm:min-w-[120px] sm:items-center sm:border-r sm:border-white/10 sm:pr-6">
        <div className="text-lg font-black tracking-tighter text-white">
          {res.hora_inicio?.slice(0, 5) || "--:--"}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          hasta {res.hora_fin?.slice(0, 5) || "--:--"}
        </div>
      </div>

      {/* Información del Cliente y Servicio */}
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-bold text-white uppercase tracking-tight">
            {res.nombre}
          </h4>
          {(res.cliente_total_reservas || 0) > 1 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-black text-accent border border-accent/20" title="Cliente recurrente">
              ⟳
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
              STATUS_COLORS[res.estado] || "bg-gray-500/10 text-gray-400"
            }`}
          >
            {res.estado}
          </span>
          {res.is_block && (
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30">
              SESIÓN PACK
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-medium text-accent italic">
            {res.is_block ? res.block_title : res.servicio?.nombre || "Servicio no especificado"}
          </p>
          {res.precio !== null && (
            <span className="text-xs font-bold text-white/90">
              · {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(res.precio)}
              {res.is_block && <span className="text-[10px] text-muted ml-1 font-normal">(Total)</span>}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted font-medium">
          <div className="flex items-center gap-1">
            <span className="opacity-50">📧</span> {res.email}
          </div>
          <div className="flex items-center gap-1">
            <span className="opacity-50">📱</span> {res.telefono}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 sm:pl-4">
        {!res.is_block ? (
          <>
            {res.estado === "pendiente" && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleStatus("confirmada")}
                  disabled={isPending}
                  className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 transition-all hover:bg-green-500 hover:text-black disabled:opacity-50"
                  title="Confirmar"
                >
                  ✓
                </button>
                <button
                  onClick={() => handleStatus("rechazada")}
                  disabled={isPending}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-black disabled:opacity-50"
                  title="Rechazar"
                >
                  ✕
                </button>
              </div>
            )}
            <Link
              href={`/admin/calendario/${res.id}`}
              className="rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10"
            >
              EDITAR
            </Link>
          </>
        ) : (
          <Link
            href={`/admin/calendario/${res.parent_reserva_id}`}
            className="rounded-lg bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500/20"
          >
            VER PACK
          </Link>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="ml-auto rounded-lg bg-red-500/5 px-3 py-2 text-sm transition-all hover:bg-red-500/20 hover:text-red-400 sm:ml-0"
          title={res.is_block ? "Eliminar bloque" : "Eliminar reserva"}
        >
          🗑
        </button>
      </div>
    </div>
  );
}