import { AtSign, Mail, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "./ui";

interface ClienteQuickActionsProps {
  nombre: string;
  email: string | null;
  telefono: string | null;
  instagram: string | null;
}

/** Contacto rápido y alta de reserva. La reserva es la acción principal de la ficha. */
export default function ClienteQuickActions({ nombre, email, telefono, instagram }: ClienteQuickActionsProps) {
  const waLink = telefono ? `https://wa.me/${telefono.replace(/\s+/g, "")}` : null;
  const mailLink = email ? `mailto:${email}` : null;
  const instaLink = instagram ? `https://instagram.com/${instagram.replace("@", "")}` : null;

  return (
    <>
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
          <MessageCircle aria-hidden /> WhatsApp
        </a>
      )}
      {mailLink && (
        <a href={mailLink} className={buttonClass("secondary", "md")}>
          <Mail aria-hidden /> Email
        </a>
      )}
      {instaLink && (
        <a href={instaLink} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
          <AtSign aria-hidden /> Instagram
        </a>
      )}
      <Link href={`/admin/calendario/nueva?cliente=${encodeURIComponent(nombre)}`} className={buttonClass("primary", "md")}>
        <Plus aria-hidden /> Nueva reserva
      </Link>
    </>
  );
}
