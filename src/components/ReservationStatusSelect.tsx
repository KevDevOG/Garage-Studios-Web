"use client";

import { useTransition } from "react";
import { updateReservationStatus } from "@/app/actions/admin";

interface Props {
  id: string;
  currentStatus: string;
}

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-accent/10 text-accent hover:bg-accent/20",
  confirmada: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelada: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  rechazada: "bg-red-500/10 text-red-300 hover:bg-red-500/20",
  completada: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
};

export default function ReservationStatusSelect({ id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;

    startTransition(async () => {
      try {
        await updateReservationStatus(id, newStatus);
      } catch (error) {
        console.error("Error updating status:", error);
        alert("Hubo un error al actualizar el estado de la reserva.");
      }
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className={`cursor-pointer rounded-full border border-transparent px-2.5 py-1 text-xs font-medium capitalize outline-none transition-colors focus:border-card-border focus:ring-1 focus:ring-card-border disabled:cursor-not-allowed disabled:opacity-50 ${
        STATUS_STYLES[currentStatus] || "bg-gray-500/10 text-gray-400"
      }`}
    >
      <option value="pendiente" className="bg-card-bg text-foreground">
        Pendiente
      </option>
      <option value="confirmada" className="bg-card-bg text-foreground">
        Confirmada
      </option>
      <option value="cancelada" className="bg-card-bg text-foreground">
        Cancelada
      </option>
      <option value="rechazada" className="bg-card-bg text-foreground">
        Rechazada
      </option>
      <option value="completada" className="bg-card-bg text-foreground">
        Completada
      </option>
    </select>
  );
}
