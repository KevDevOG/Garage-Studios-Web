"use client";

import { useTransition } from "react";
import { deleteReservation } from "@/app/actions/calendario";

export default function DeleteReservationButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("¿Eliminar esta reserva? Esta acción realizará un borrado lógico.")) return;
    
    startTransition(async () => {
      await deleteReservation(id);
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="ml-2 rounded-lg bg-red-500/10 p-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-black disabled:opacity-50"
      title="Eliminar reserva"
    >
      🗑
    </button>
  );
}
