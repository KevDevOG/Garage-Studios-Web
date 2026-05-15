"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Maximize2, Minimize2, Download, LogOut } from "lucide-react";
import { CompactModeProvider, useCompactMode } from "./CompactModeProvider";

function AdminNavContent({ title }: { title: string }) {
  const pathname = usePathname();
  const { isCompact, toggleCompact } = useCompactMode();

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/servicios", label: "Servicios" },
    { href: "/admin/galeria", label: "Galería" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/calendario", label: "Calendario" },
    { href: "/admin/finanzas", label: "Finanzas" },
    { href: "/admin/exportaciones", label: "Exportar", icon: Download },
    { href: "/admin/auditoria", label: "Auditoría" },
  ];

  return (
    <div className="mb-8 border-b border-card-border pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold truncate pr-4 text-white">{title}</h1>
        
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Toggle Vista Compacta */}
          <button
            onClick={toggleCompact}
            title={isCompact ? "Vista Normal" : "Vista Compacta"}
            className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-muted hover:text-accent hover:border-accent/50 transition-all"
          >
            {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-red-400/80 transition-all hover:text-red-400 bg-red-400/5 px-3 py-2 rounded-lg border border-red-400/10 hover:border-red-400/30 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </div>

      <nav className="flex gap-4 sm:gap-6 text-sm text-muted overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {links.map((link) => {
          const isActive = pathname ? (pathname === link.href || pathname.startsWith(`${link.href}/`)) : false;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-accent whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
                isActive 
                  ? "text-accent border-accent font-black uppercase tracking-tighter" 
                  : "border-transparent"
              }`}
            >
              {link.icon && <link.icon className="w-3.5 h-3.5" />}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminNav(props: { title: string }) {
  return (
    <CompactModeProvider>
      <AdminNavContent {...props} />
    </CompactModeProvider>
  );
}
