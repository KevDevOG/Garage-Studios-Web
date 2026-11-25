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
      className={`!w-auto disabled:cursor-not-allowed disabled:opacity-50 ${
        RESERVA_STATUS[currentStatus]?.colorClass ?? "text-gs-soft"
      }`}
    >
      {RESERVATION_STATES.map((estado) => (
        <option key={estado} value={estado}>
          {RESERVA_STATUS[estado]?.label ?? estado}
        </option>
      ))}
    </select>
  );
}
