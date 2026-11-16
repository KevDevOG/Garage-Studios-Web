"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateContactStatus } from "@/app/actions/admin";

interface Props {
  id: string;
  isRead: boolean;
}

export default function ContactStatusButton({ id, isRead }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await updateContactStatus(id, !isRead);
        if (!result.ok) toast.error(result.error);
      } catch (error) {
        console.error("Error updating contact status:", error);
        toast.error("Hubo un error al actualizar el mensaje.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isRead}
      aria-label={isRead ? "Marcar mensaje como no leído" : "Marcar mensaje como leído"}
      className={`inline-block min-h-[32px] cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isRead
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : "bg-accent/10 text-accent hover:bg-accent/20"
      }`}
    >
      {isRead ? "Leído" : "Nuevo"}
    </button>
  );
}
