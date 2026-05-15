"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteBloqueo } from "@/app/actions/bloqueos";

interface DeleteBloqueoButtonProps {
  id: string;
}

export default function DeleteBloqueoButton({ id }: DeleteBloqueoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBloqueo(id);
        setShowConfirm(false);
      } catch (error) {
        alert("No se pudo eliminar el bloqueo");
      }
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mx-auto" />
          ) : (
            "Confirmar"
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      title="Eliminar bloqueo"
      className="group flex items-center justify-center rounded-lg p-2 text-red-400/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
