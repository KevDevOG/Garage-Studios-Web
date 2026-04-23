"use client";

import { useState, useTransition } from "react";
import { deleteServiceAction } from "@/app/actions/servicios";

export default function DeleteServiceButton({ id }: { id: string }) {
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
      <span className="ml-4 inline-flex items-center gap-2 rounded bg-red-500/10 px-2 py-1">
        <span className="text-xs font-medium text-red-500">{errorMsg}</span>
        <button
          type="button"
          onClick={() => setErrorMsg(null)}
          className="text-xs text-muted hover:text-white"
          title="Cerrar aviso"
        >
          ✕
        </button>
      </span>
    );
  }

  if (isConfirming) {
    return (
      <span className="ml-4 inline-flex items-center gap-3">
        <span className="text-xs text-muted">¿Seguro?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="font-medium text-red-500 hover:text-red-400 hover:underline disabled:opacity-50"
        >
          {isPending ? "Borrando..." : "Sí"}
        </button>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
          className="text-muted hover:text-white hover:underline disabled:opacity-50"
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
      className="ml-4 inline-flex cursor-pointer items-center text-red-500 transition-colors hover:text-red-400 hover:underline"
      title="Eliminar servicio"
    >
      Eliminar
    </button>
  );
}
