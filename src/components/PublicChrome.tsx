"use client";

import { usePathname } from "next/navigation";

/**
 * Decide qué "cromo" rodea a cada ruta.
 *
 * - Web pública: Navbar + <main id="contenido"> + Footer, con exactamente el
 *   mismo marcado y las mismas clases que tenía el layout raíz.
 * - /admin: no pinta nada propio. El layout de /admin (AdminShell) aporta su
 *   marco y su propio <main id="contenido">, así no hay <main> anidados.
 *
 * Navbar y Footer llegan como props ya renderizadas desde el layout raíz
 * (Server Component), de modo que siguen siendo los mismos componentes.
 */
export function isAdminPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function PublicChrome({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isAdminPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {navbar}
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      {footer}
    </>
  );
}
