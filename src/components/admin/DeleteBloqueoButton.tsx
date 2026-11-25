"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBloqueo } from "@/app/actions/bloqueos";
import { buttonClass } from "./ui";

interface DeleteBloqueoButtonProps {
  id: string;
}

/** Quita un bloqueo de horas, con confirmación en línea. */
export default function DeleteBloqueoButton({ id }: DeleteBloqueoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteBloqueo(id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setShowConfirm(false);
        toast.success("Bloqueo eliminado.");
      } catch {
        toast.error("No se pudo eliminar el bloqueo. Inténtalo de nuevo.");
      }
    });
  };

  if (showConfirm) {
    return (
      <span role="group" aria-label="Confirmar eliminación del bloqueo" className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-gs-soft">¿Quitar el bloqueo?</span>
        <button type="button" onClick={handleDelete} disabled={isPending} className={buttonClass("danger", "sm")}>
          {isPending ? "Quitando…" : "Sí, quitar"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className={buttonClass("ghost", "sm")}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      aria-label="Quitar bloqueo"
      title="Quitar bloqueo"
      className={buttonClass("ghost", "sm", "w-10 px-0 hover:text-gs-bad sm:w-8")}
    >
      <Trash2 aria-hidden />
    </button>
  );
}
