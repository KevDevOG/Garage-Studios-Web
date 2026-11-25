"use client";

import { useTransition } from "react";
import { Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { updateContactStatus } from "@/app/actions/admin";
import { buttonClass } from "@/components/admin/ui";

interface Props {
  id: string;
  isRead: boolean;
}

/** Marca un mensaje de contacto como leído o lo devuelve a "sin leer". */
export default function ContactStatusButton({ id, isRead }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await updateContactStatus(id, !isRead);
        if (!result.ok) toast.error(result.error);
      } catch (error) {
        console.error("Error updating contact status:", error);
        toast.error("No se pudo actualizar el mensaje. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={buttonClass(isRead ? "ghost" : "secondary", "sm")}
    >
      {isRead ? <Mail aria-hidden /> : <MailOpen aria-hidden />}
      {isRead ? "Marcar como no leído" : "Marcar como leído"}
    </button>
  );
}
