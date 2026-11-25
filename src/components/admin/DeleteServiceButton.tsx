"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteServiceAction } from "@/app/actions/servicios";
import { buttonClass } from "@/components/admin/ui";

export default function DeleteServiceButton({ id, nombre }: { id: string; nombre?: string }) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await deleteServiceAction(id);

        if (result?.error) {
          setErrorMsg(result.error);
        }

        setIsConfirming(false);
      } catch (error) {
        console.error("Error al borrar:", error);
        setErrorMsg("Ocurrió un error de red.");
        setIsConfirming(false);
      }
    });
  };

  if (errorMsg) {
    return (
      <span
        role="alert"
        className="inline-flex items-center gap-1 rounded-md border border-[#4d2623] bg-[#1d1211] pl-2.5 text-[12px] font-medium text-gs-bad"
      >
        {errorMsg}
        <button
          type="button"
          onClick={() => setErrorMsg(null)}
          className={buttonClass("ghost", "sm", "!px-2")}
          aria-label="Cerrar aviso"
        >
          <X aria-hidden strokeWidth={1.75} />
        </button>
      </span>
    );
  }

  if (isConfirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="px-1 text-[13px] text-gs-soft">¿Eliminar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={buttonClass("danger", "sm")}
        >
          {isPending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
          className={buttonClass("ghost", "sm")}
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      className={buttonClass("ghost", "sm", "hover:!text-gs-bad")}
      aria-label={nombre ? `Eliminar ${nombre}` : "Eliminar servicio"}
      title="Eliminar servicio"
    >
      <Trash2 aria-hidden strokeWidth={1.75} />
      Eliminar
    </button>
  );
}
