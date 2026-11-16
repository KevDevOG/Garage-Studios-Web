"use client";

import { useState, useTransition } from "react";
import { Check, X, CheckCircle2, Ban } from "lucide-react";
import { toast } from "sonner";
import { updateReservationStatus } from "@/app/actions/admin";
import type { ReservationState } from "@/lib/reservation-states";

interface QuickActionButtonsProps {
  id: string;
  currentStatus: string;
}

const LABELS: Record<string, string> = {
  confirmada: "Confirmar reserva",
  rechazada: "Rechazar reserva",
  completada: "Marcar como completada",
  cancelada: "Cancelar reserva",
};

const DESTRUCTIVE: ReservationState[] = ["cancelada", "rechazada"];

function ActionButton({
  status,
  Icon,
  tone,
  disabled,
  onClick,
}: {
  status: ReservationState;
  Icon: typeof Check;
  tone: string;
  disabled: boolean;
  onClick: (status: ReservationState) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(status)}
      disabled={disabled}
      title={LABELS[status]}
      aria-label={LABELS[status]}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${tone}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Botones rápidos de estado. Las acciones destructivas piden una segunda
 * pulsación en línea en vez de usar `confirm()` nativo.
 */
export default function QuickActionButtons({ id, currentStatus }: QuickActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingConfirm, setPendingConfirm] = useState<ReservationState | null>(null);

  const run = (newStatus: ReservationState) => {
    startTransition(async () => {
      try {
        const result = await updateReservationStatus(id, newStatus);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`Reserva ${newStatus}.`);
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Error al actualizar el estado.");
      } finally {
        setPendingConfirm(null);
      }
    });
  };

  const handleAction = (newStatus: ReservationState) => {
    if (DESTRUCTIVE.includes(newStatus) && pendingConfirm !== newStatus) {
      setPendingConfirm(newStatus);
      return;
    }
    run(newStatus);
  };

  if (currentStatus === "cancelada" || currentStatus === "rechazada" || currentStatus === "completada") {
    return null;
  }

  if (pendingConfirm) {
    return (
      <div className="flex items-center gap-2" role="group" aria-label="Confirmar acción">
        <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
          ¿{pendingConfirm === "cancelada" ? "Cancelar" : "Rechazar"}?
        </span>
        <button
          type="button"
          onClick={() => run(pendingConfirm)}
          disabled={isPending}
          className="min-h-[36px] rounded-lg border border-red-500/30 bg-red-500/20 px-3 text-xs font-black uppercase text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => setPendingConfirm(null)}
          disabled={isPending}
          className="min-h-[36px] rounded-lg border border-white/10 px-3 text-xs font-black uppercase text-muted transition-colors hover:text-white disabled:opacity-50"
        >
          No
        </button>
      </div>
    );
  }

  const common = { disabled: isPending, onClick: handleAction };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "pendiente" && (
        <>
          <ActionButton {...common} status="confirmada" Icon={Check} tone="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" />
          <ActionButton {...common} status="rechazada" Icon={Ban} tone="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" />
        </>
      )}

      {currentStatus === "confirmada" && (
        <>
          <ActionButton {...common} status="completada" Icon={CheckCircle2} tone="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" />
          <ActionButton {...common} status="cancelada" Icon={X} tone="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" />
        </>
      )}
    </div>
  );
}
