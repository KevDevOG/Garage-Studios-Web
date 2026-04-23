"use client";

import { useTransition } from "react";
import { updateReservationStatus } from "@/app/actions/admin";

interface Props {
  id: string;
  currentStatus: string;
}

export default function ReservationStatusSelect({ id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    
    // startTransition permite actualizar la UI sin bloquear, 
    // y cuando la Server Action termina, Next.js refresca los datos.
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
        currentStatus === "confirmada"
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : currentStatus === "cancelada"
          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
          : "bg-accent/10 text-accent hover:bg-accent/20"
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
    </select>
  );
}
