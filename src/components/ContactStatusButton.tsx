"use client";

import { useTransition } from "react";
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
        await updateContactStatus(id, !isRead);
      } catch (error) {
        console.error("Error updating contact status:", error);
        alert("Hubo un error al actualizar el mensaje.");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isRead
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : "bg-accent/10 text-accent hover:bg-accent/20"
      }`}
      title={isRead ? "Marcar como no leído" : "Marcar como leído"}
    >
      {isRead ? "Leído" : "Nuevo"}
    </button>
  );
}
