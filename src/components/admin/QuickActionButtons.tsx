"use client";

import { useTransition } from "react";
import { Check, X, CheckCircle2, Ban } from "lucide-react";
import { updateReservationStatus } from "@/app/actions/admin";

interface QuickActionButtonsProps {
  id: string;
  currentStatus: string;
}

export default function QuickActionButtons({ id, currentStatus }: QuickActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (newStatus: string) => {
    if (newStatus === 'cancelada' || newStatus === 'rechazada') {
      if (!confirm(`¿Estás seguro de que deseas marcar esta reserva como ${newStatus}?`)) return;
    }

    startTransition(async () => {
      try {
        await updateReservationStatus(id, newStatus);
      } catch (error) {
        console.error("Error updating status:", error);
        alert("Error al actualizar el estado");
      }
    });
  };

  if (currentStatus === 'cancelada' || currentStatus === 'rechazada' || currentStatus === 'completada') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'pendiente' && (
        <>
          <button
            onClick={() => handleAction('confirmada')}
            disabled={isPending}
            title="Confirmar"
            className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleAction('rechazada')}
            disabled={isPending}
            title="Rechazar"
            className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            <Ban className="h-4 w-4" />
          </button>
        </>
      )}

      {currentStatus === 'confirmada' && (
        <>
          <button
            onClick={() => handleAction('completada')}
            disabled={isPending}
            title="Completar"
            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleAction('cancelada')}
            disabled={isPending}
            title="Cancelar"
            className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
