"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleServiceActiveAction } from "@/app/actions/servicios";
import { TONE_BG, TONE_TEXT, cx } from "@/components/admin/ui";

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
        toast.error("No se pudo cambiar el estado del servicio. Inténtalo de nuevo.");
      }
    });
  };

  const tone = isActivo ? "ok" : "neutral";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isActivo}
      title={isActivo ? "Pulsa para desactivar" : "Pulsa para activar"}
      className={cx(
        "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-gs-line bg-gs-raised px-3 text-[12px] font-medium leading-none transition-colors hover:border-gs-line-strong disabled:cursor-not-allowed disabled:opacity-50 sm:h-8",
        TONE_TEXT[tone],
      )}
    >
      <span aria-hidden className={cx("size-1.5 shrink-0 rounded-full", TONE_BG[tone])} />
      {isActivo ? "Activo" : "Inactivo"}
    </button>
  );
}
