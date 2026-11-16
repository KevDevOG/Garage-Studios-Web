"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateReservationStatus } from "@/app/actions/admin";
import { RESERVATION_STATES } from "@/lib/reservation-states";
import { RESERVA_STATUS } from "@/lib/status-colors";

interface Props {
  id: string;
  currentStatus: string;
  /** Nombre del cliente para el aria-label del selector. */
  clienteNombre?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-accent/10 text-accent hover:bg-accent/20",
  confirmada: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelada: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  rechazada: "bg-red-500/10 text-red-300 hover:bg-red-500/20",
  completada: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
};

export default function ReservationStatusSelect({ id, currentStatus, clienteNombre }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    startTransition(async () => {
      try {
        const result = await updateReservationStatus(id, newStatus);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`Reserva marcada como ${RESERVA_STATUS[newStatus]?.label.toLowerCase() ?? newStatus}.`);
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Hubo un error al actualizar el estado de la reserva.");
      }
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      aria-busy={isPending}
      aria-label={clienteNombre ? `Estado de la reserva de ${clienteNombre}` : "Estado de la reserva"}
      className={`min-h-[36px] cursor-pointer rounded-full border border-transparent px-2.5 py-1 text-xs font-medium capitalize outline-none transition-colors focus:border-card-border focus:ring-1 focus:ring-card-border disabled:cursor-not-allowed disabled:opacity-50 ${
        STATUS_STYLES[currentStatus] || "bg-gray-500/10 text-gray-400"
      }`}
    >
      {RESERVATION_STATES.map((estado) => (
        <option key={estado} value={estado} className="bg-card-bg text-foreground">
          {RESERVA_STATUS[estado]?.label ?? estado}
        </option>
      ))}
    </select>
  );
}
