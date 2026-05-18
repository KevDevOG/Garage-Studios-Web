"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVisualsImage, toggleVisualsImageActive } from "@/app/actions/visuals";
import { Trash2, Power, PowerOff, Loader2 } from "lucide-react";

interface VisualsQuickActionsProps {
  id: string;
  activo: boolean;
  titulo: string | null;
}

export default function VisualsQuickActions({ id, activo, titulo }: VisualsQuickActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const displayTitulo = titulo || "esta imagen";

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Seguro que quieres borrar ${displayTitulo === "esta imagen" ? "esta imagen" : `la imagen "${displayTitulo}"`}?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    startTransition(async () => {
      try {
        const res = await deleteVisualsImage(id);
        if (!res.success) {
          alert(res.error || "Ocurrió un error al intentar eliminar la imagen.");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("Error al eliminar imagen:", err);
        alert("Ocurrió un error inesperado al intentar eliminar la imagen.");
      } finally {
        setIsDeleting(false);
      }
    });
  }

  async function handleToggleActive() {
    setIsToggling(true);
    startTransition(async () => {
      try {
        const res = await toggleVisualsImageActive(id);
        if (!res.success) {
          alert(res.error || "Ocurrió un error al intentar cambiar el estado de la imagen.");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("Error al cambiar estado:", err);
        alert("Ocurrió un error inesperado al intentar cambiar el estado de la imagen.");
      } finally {
        setIsToggling(false);
      }
    });
  }

  const isLoading = isDeleting || isToggling || isPending;

  return (
    <div className="flex gap-2">
      {/* Botón de Activar / Desactivar */}
      <button
        onClick={handleToggleActive}
        disabled={isLoading}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
          activo
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
        }`}
        title={activo ? "Desactivar de la galería pública" : "Activar en la galería pública"}
      >
        {isToggling ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : activo ? (
          <PowerOff className="w-3.5 h-3.5" />
        ) : (
          <Power className="w-3.5 h-3.5" />
        )}
        {activo ? "Desactivar" : "Activar"}
      </button>

      {/* Botón de Borrar Rápido */}
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-50"
        title="Eliminar imagen"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Borrar
      </button>
    </div>
  );
}
