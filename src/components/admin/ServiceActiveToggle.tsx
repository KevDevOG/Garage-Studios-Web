"use client";

import { useTransition } from "react";
import { toggleServiceActiveAction } from "@/app/actions/servicios";

export default function ServiceActiveToggle({
  id,
  isActivo,
}: {
  id: string;
  isActivo: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleServiceActiveAction(id, !isActivo);
      } catch (e) {
        console.error(e);
        alert("Error al cambiar estado");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isActivo
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : "bg-white/10 text-muted hover:bg-white/20 hover:text-white"
      }`}
    >
      {isActivo ? "Activo" : "Inactivo"}
    </button>
  );
}
