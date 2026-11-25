"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteImageAction } from "@/app/actions/galeria";
import { buttonClass } from "@/components/admin/ui";

export default function DeleteImageButton({ id, titulo }: { id: string; titulo?: string }) {
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await deleteImageAction(id);

        if (result?.error) {
          setErrorMsg(result.error);
        }

        setIsConfirming(false);
      } catch (error) {
        console.error("Error al borrar imagen:", error);
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
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="px-1 text-[13px] text-gs-soft">¿Eliminar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={buttonClass("danger", "sm")}
        >
          {isPending ? "Eliminando..." : "Sí"}
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
      aria-label={titulo ? `Eliminar imagen ${titulo}` : "Eliminar imagen"}
    >
      <Trash2 aria-hidden strokeWidth={1.75} />
      Eliminar
    </button>
  );
}
