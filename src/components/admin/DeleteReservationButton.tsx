"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReservation, deleteReservationBlock } from "@/app/actions/calendario";
import { buttonClass } from "./ui";

/**
 * Elimina una reserva (o un bloque de pack) con confirmación en línea: la
 * primera pulsación pregunta, la segunda ejecuta. Sin `confirm()` nativo.
 */
export default function DeleteReservationButton({
  id,
  isBlock = false,
  nombre,
}: {
  id: string;
  /** El id es de un bloque de pack (reserva_bloque), no de una reserva. */
  isBlock?: boolean;
  /** Nombre del cliente, para el nombre accesible del botón. */
  nombre?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const what = isBlock ? "bloque" : "reserva";

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = isBlock ? await deleteReservationBlock(id) : await deleteReservation(id);
        if (result && "error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success(isBlock ? "Bloque eliminado." : "Reserva eliminada.");
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo eliminar. Inténtalo de nuevo.");
      } finally {
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <span role="group" aria-label={`Confirmar eliminación de la ${what}`} className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-gs-soft">¿Eliminar?</span>
        <button type="button" onClick={handleDelete} disabled={isPending} className={buttonClass("danger", "sm")}>
          {isPending ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className={buttonClass("ghost", "sm")}
        >
          No
        </button>
      </span>
    );
  }

  const label = `Eliminar ${what}${nombre ? ` de ${nombre}` : ""}`;
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      title={label}
      className={buttonClass("ghost", "sm", "w-10 px-0 hover:text-gs-bad sm:w-8")}
    >
      <Trash2 aria-hidden />
    </button>
  );
}
