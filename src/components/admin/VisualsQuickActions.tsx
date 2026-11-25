"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteVisualsImage, toggleVisualsImageActive } from "@/app/actions/visuals";
import { Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/admin/ui";

interface VisualsQuickActionsProps {
  id: string;
  activo: boolean;
  titulo: string | null;
}

const ICON_BTN = "w-10 px-0 sm:w-8";

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
          toast.error(res.error || "No se pudo eliminar la imagen.");
        } else {
          toast.success("Imagen eliminada.");
          router.refresh();
        }
      } catch (err) {
        console.error("Error al eliminar imagen:", err);
        toast.error("No se pudo eliminar la imagen. Inténtalo de nuevo.");
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
          toast.error(res.error || "No se pudo cambiar la visibilidad de la imagen.");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("Error al cambiar estado:", err);
        toast.error("No se pudo cambiar la visibilidad de la imagen. Inténtalo de nuevo.");
      } finally {
        setIsToggling(false);
      }
    });
  }

  const isLoading = isDeleting || isToggling || isPending;
  const toggleLabel = activo ? "Ocultar de la galería pública" : "Publicar en la galería pública";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={isLoading}
        className={buttonClass("ghost", "sm", ICON_BTN)}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {isToggling ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : activo ? (
          <EyeOff aria-hidden />
        ) : (
          <Eye aria-hidden />
        )}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className={buttonClass("ghost", "sm", `${ICON_BTN} hover:text-gs-bad`)}
        aria-label="Borrar imagen"
        title="Borrar imagen"
      >
        {isDeleting ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />}
      </button>
    </div>
  );
}
