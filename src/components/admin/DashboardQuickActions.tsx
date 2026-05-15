"use client";

import Link from "next/link";
import { PlusCircle, Calendar, Users, Wallet, Download, Clock } from "lucide-react";

const ACTIONS = [
  { label: "Nueva Reserva", href: "/admin/calendario/nueva", icon: PlusCircle, color: "bg-accent/10 text-accent border-accent/20" },
  { label: "Bloquear", href: "/admin/calendario", icon: Clock, color: "bg-red-400/10 text-red-400 border-red-400/20" },
  { label: "Calendario", href: "/admin/calendario", icon: Calendar, color: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  { label: "Clientes", href: "/admin/clientes", icon: Users, color: "bg-purple-400/10 text-purple-400 border-purple-400/20" },
  { label: "Finanzas", href: "/admin/finanzas", icon: Wallet, color: "bg-green-400/10 text-green-400 border-green-400/20" },
  { label: "Exportar", href: "/admin/exportaciones", icon: Download, color: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {ACTIONS.map((action) => (
        <Link 
          key={action.label} 
          href={action.href}
          className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${action.color} hover:scale-[1.02] transition-all group`}
        >
          <action.icon className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
