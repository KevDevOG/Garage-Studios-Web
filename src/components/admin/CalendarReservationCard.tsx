"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateReservationStatus } from "@/app/actions/admin";
import { deleteReservation, deleteReservationBlock } from "@/app/actions/calendario";
import type { ReservationRow } from "@/app/actions/calendario";
import { formatTime } from "@/lib/schedule";

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleStatus = (status: string) => {
    startTransition(async () => {
      try {
        const result = await updateReservationStatus(res.id, status);
        if (!result.ok) {
          toast.error(result.error);
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo actualizar el estado. Inténtalo de nuevo.");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = res.is_block
          ? await deleteReservationBlock(res.id)
          : await deleteReservation(res.id);
        if (result && "error" in result && result.error) {
          toast.error(result.error);
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo eliminar. Inténtalo de nuevo.");
      } finally {
        setIsConfirmingDelete(false);
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
          {formatTime(res.hora_inicio)}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          hasta {formatTime(res.hora_fin)}
        </div>
      </div>

      {/* Información del Cliente y Servicio */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-bold text-white uppercase tracking-tight break-words">
            {res.nombre}
          </h4>
          {(res.cliente_total_reservas || 0) > 1 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-black text-accent border border-accent/20" title="Cliente recurrente">
              ⟳
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
              STATUS_COLORS[res.estado] || "bg-gray-500/10 text-gray-400"
            }`}
          >
            {res.estado}
          </span>
          {res.is_block && (
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30">
              SESIÓN PACK
            </span>
          )}
          {res.estado_pago && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border ${
                res.estado_pago === 'pagado' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                res.estado_pago === 'parcial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {res.estado_pago}
              {res.estado_pago === 'parcial' && res.importe_pagado ? ` (${res.importe_pagado}€)` : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-medium text-accent italic">
            {res.is_block ? res.block_title : res.servicio?.nombre || "Servicio no especificado"}
          </p>
          {typeof res.precio === "number" && Number.isFinite(res.precio) && (
            <span className="text-xs font-bold text-white/90">
              · {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(res.precio)}
              {res.is_block && <span className="text-[10px] text-muted ml-1 font-normal">(Total)</span>}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted font-medium">
          {res.email && (
            <div className="flex min-w-0 items-center gap-1 break-all">
              <span className="opacity-50" aria-hidden="true">📧</span>
              <span className="sr-only">Email:</span> {res.email}
            </div>
          )}
          {res.telefono && (
            <div className="flex items-center gap-1">
              <span className="opacity-50" aria-hidden="true">📱</span>
              <span className="sr-only">Teléfono:</span> {res.telefono}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 sm:pl-4">
        {!res.is_block ? (
          <>
            {res.estado === "pendiente" && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleStatus("confirmada")}
                  disabled={isPending}
                  className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 transition-all hover:bg-green-500 hover:text-black disabled:opacity-50"
                  title="Confirmar"
                  aria-label={`Confirmar reserva de ${res.nombre}`}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => handleStatus("rechazada")}
                  disabled={isPending}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-black disabled:opacity-50"
                  title="Rechazar"
                  aria-label={`Rechazar reserva de ${res.nombre}`}
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
        ) : res.parent_reserva_id ? (
          <Link
            href={`/admin/calendario/${res.parent_reserva_id}`}
            className="rounded-lg bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500/20"
          >
            VER PACK
          </Link>
        ) : null}

        {isConfirmingDelete ? (
          <span className="ml-auto inline-flex items-center gap-3 text-xs sm:ml-0">
            <span className="text-muted">
              {res.is_block ? "¿Eliminar bloque? Es definitivo." : "¿Eliminar reserva?"}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="font-bold text-red-500 hover:text-red-400 hover:underline disabled:opacity-50"
            >
              {isPending ? "Eliminando..." : "Sí"}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isPending}
              className="text-muted hover:text-white hover:underline disabled:opacity-50"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isPending}
            className="ml-auto rounded-lg bg-red-500/5 px-3 py-2 text-sm transition-all hover:bg-red-500/20 hover:text-red-400 sm:ml-0"
            title={res.is_block ? "Eliminar bloque" : "Eliminar reserva"}
            aria-label={res.is_block ? `Eliminar bloque de ${res.nombre}` : `Eliminar reserva de ${res.nombre}`}
          >
            <span aria-hidden="true">🗑</span>
          </button>
        )}
      </div>
    </div>
  );
}
