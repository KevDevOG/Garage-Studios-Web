"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default function AdminNav({ title }: { title: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/servicios", label: "Servicios" },
    { href: "/admin/galeria", label: "Galería" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/calendario", label: "Calendario" },
    { href: "/admin/finanzas", label: "Finanzas" },
    { href: "/admin/auditoria", label: "Auditoría" },
  ];

  return (
    <div className="mb-8 border-b border-card-border pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold truncate pr-4">{title}</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs sm:text-sm font-medium text-red-400 transition-colors hover:text-red-300 hover:underline whitespace-nowrap"
          >
            Cerrar Sesión
          </button>
        </form>
      </div>

      <nav className="flex gap-4 sm:gap-6 text-sm text-muted overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {links.map((link) => {
          const isActive = pathname ? (pathname === link.href || pathname.startsWith(`${link.href}/`)) : false;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-accent whitespace-nowrap py-1 border-b-2 ${
                isActive 
                  ? "text-accent border-accent font-bold" 
                  : "border-transparent"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
