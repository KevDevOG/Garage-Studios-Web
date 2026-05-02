"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateReservationStatus } from "@/app/actions/admin";
import { deleteReservation } from "@/app/actions/calendario";
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
    if (!confirm("¿Eliminar esta reserva? (borrado lógico)")) return;
    startTransition(async () => {
      await deleteReservation(res.id);
    });
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-card-border p-4 transition-opacity sm:flex-row sm:items-center sm:justify-between ${
        isPending ? "opacity-50" : ""
      }`}
    >
      {/* Info principal */}
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {res.hora_inicio ? (
            <span className="text-sm font-bold text-white">
              {res.hora_inicio?.slice(0, 5)} — {res.hora_fin?.slice(0, 5)}
            </span>
          ) : (
            <span className="text-xs text-muted italic">Sin hora</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              STATUS_COLORS[res.estado] || "bg-gray-500/10 text-gray-400"
            }`}
          >
            {res.estado}
          </span>
          {res.origen === "manual" && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted">
              Manual
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="font-semibold text-white">{res.nombre}</span>
          <span className="text-muted"> — {res.servicio?.nombre || "N/A"}</span>
          {res.is_block ? (
            <span className="ml-2 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
              Bloque: {res.block_title}
            </span>
          ) : (
            <span className="ml-2 text-xs text-muted italic">(Solicitud principal)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 text-xs text-muted">
          <span>{res.email}</span>
          <span>{res.telefono}</span>
        </div>
        {res.observaciones && (
          <p className="text-xs italic text-muted">"{res.observaciones}"</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        {!res.is_block ? (
          <>
            {res.estado === "pendiente" && (
              <>
                <button
                  onClick={() => handleStatus("confirmada")}
                  disabled={isPending}
                  className="rounded-md bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleStatus("rechazada")}
                  disabled={isPending}
                  className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </>
            )}
            {res.estado === "confirmada" && (
              <button
                onClick={() => handleStatus("completada")}
                disabled={isPending}
                className="rounded-md bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
              >
                Completar
              </button>
            )}
            {(res.estado === "pendiente" || res.estado === "confirmada") && (
              <button
                onClick={() => handleStatus("cancelada")}
                disabled={isPending}
                className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <Link
              href={`/admin/calendario/${res.id}`}
              className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-500/50 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              🗑
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center text-[10px] italic text-muted pr-2">
              Gestionar desde reserva
            </span>
            <Link
              href={`/admin/calendario/${res.parent_reserva_id}`}
              className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              Ver reserva
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
