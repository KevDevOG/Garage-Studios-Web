"use client";

import { MessageCircle, Mail, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ClienteQuickActionsProps {
  nombre: string;
  email: string | null;
  telefono: string | null;
  instagram: string | null;
}

export default function ClienteQuickActions({ nombre, email, telefono, instagram }: ClienteQuickActionsProps) {
  
  const waLink = telefono ? `https://wa.me/${telefono.replace(/\s+/g, '')}` : null;
  const mailLink = email ? `mailto:${email}` : null;
  const instaLink = instagram ? `https://instagram.com/${instagram.replace('@', '')}` : null;

  return (
    <div className="flex flex-wrap gap-3">
      {waLink && (
        <a 
          href={waLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-500 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/10"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      )}

      {mailLink && (
        <a 
          href={mailLink}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg"
        >
          <Mail className="w-4 h-4" /> Email
        </a>
      )}

      {instaLink && (
        <a 
          href={instaLink}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Instagram
        </a>
      )}

      <Link 
        href={`/admin/calendario/nueva?cliente=${nombre}`}
        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-accent text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent-hover transition-all shadow-lg shadow-accent/10"
      >
        <PlusCircle className="w-4 h-4" /> Nueva Reserva
      </Link>
    </div>
  );
}
