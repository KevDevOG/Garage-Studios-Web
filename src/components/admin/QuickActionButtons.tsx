"use client";

import { useState, useTransition } from "react";
import { Ban, Check, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { updateReservationStatus } from "@/app/actions/admin";
import type { ReservationState } from "@/lib/reservation-states";
import { buttonClass } from "./ui";

interface QuickActionButtonsProps {
  id: string;
  currentStatus: string;
  /** Nombre del cliente, para los nombres accesibles. */
  nombre?: string;
}

const DONE: Record<string, string> = {
  confirmada: "Reserva confirmada.",
  rechazada: "Reserva rechazada.",
  completada: "Reserva marcada como completada.",
  cancelada: "Reserva cancelada.",
};

const DESTRUCTIVE: ReservationState[] = ["cancelada", "rechazada"];

/**
 * Siguiente paso de una reserva según su estado:
 *   pendiente  → Confirmar · Rechazar
 *   confirmada → Completar · Cancelar
 * Rechazar y cancelar piden una segunda pulsación en línea.
 */
export default function QuickActionButtons({ id, currentStatus, nombre }: QuickActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingConfirm, setPendingConfirm] = useState<ReservationState | null>(null);
  const of = nombre ? ` de ${nombre}` : "";

  const run = (newStatus: ReservationState) => {
    startTransition(async () => {
      try {
        const result = await updateReservationStatus(id, newStatus);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(DONE[newStatus] ?? "Reserva actualizada.");
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("No se pudo actualizar el estado. Inténtalo de nuevo.");
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

  if (currentStatus !== "pendiente" && currentStatus !== "confirmada") return null;

  if (pendingConfirm) {
    const verb = pendingConfirm === "cancelada" ? "cancelar" : "rechazar";
    return (
      <span role="group" aria-label={`Confirmar: ${verb} la reserva${of}`} className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-gs-soft">¿{verb.charAt(0).toUpperCase() + verb.slice(1)}?</span>
        <button
          type="button"
          onClick={() => run(pendingConfirm)}
          disabled={isPending}
          className={buttonClass("danger", "sm")}
        >
          {isPending ? "Guardando…" : `Sí, ${verb}`}
        </button>
        <button
          type="button"
          onClick={() => setPendingConfirm(null)}
          disabled={isPending}
          className={buttonClass("ghost", "sm")}
        >
          No
        </button>
      </span>
    );
  }

  const isPendiente = currentStatus === "pendiente";
  const positive: ReservationState = isPendiente ? "confirmada" : "completada";
  const negative: ReservationState = isPendiente ? "rechazada" : "cancelada";
  const negativeLabel = `${isPendiente ? "Rechazar" : "Cancelar"} reserva${of}`;
  const PositiveIcon = isPendiente ? Check : CheckCheck;
  const NegativeIcon = isPendiente ? Ban : X;

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleAction(positive)}
        disabled={isPending}
        aria-label={`${isPendiente ? "Confirmar" : "Marcar como completada la"} reserva${of}`}
        className={buttonClass("secondary", "sm", "[&_svg]:text-gs-ok")}
      >
        <PositiveIcon aria-hidden />
        {isPendiente ? "Confirmar" : "Completar"}
      </button>
      <button
        type="button"
        onClick={() => handleAction(negative)}
        disabled={isPending}
        aria-label={negativeLabel}
        title={negativeLabel}
        className={buttonClass("ghost", "sm", "w-10 px-0 hover:text-gs-bad sm:w-8")}
      >
        <NegativeIcon aria-hidden />
      </button>
    </span>
  );
}
