"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "El Estudio" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  // Guardamos la ruta en la que se abrió el menú: al navegar a otra ruta el
  // menú queda cerrado automáticamente sin necesidad de un efecto.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const setMenuOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(menuOpen) : open;
    setOpenedAt(next ? pathname : null);
  };
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape cierra el menú y devuelve el foco al botón
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenedAt(null);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  /** Si ya estamos en esa ruta, hacemos scroll suave arriba en vez de recargar. */
  const scrollTopIfSame = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-card-border bg-background/90 backdrop-blur-md">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logos */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <Link href="/" className="flex items-center" onClick={scrollTopIfSame("/")} aria-label="Garage Studios, inicio">
            <Image
              src="/images/logo-sin-fondo.png"
              alt="Garage Studios"
              width={200}
              height={60}
              sizes="(max-width: 640px) 110px, (max-width: 768px) 140px, 190px"
              className="h-8 w-auto object-contain sm:h-10 md:h-14"
              priority
            />
          </Link>

          <div className="mx-2 h-6 w-px bg-white/10 sm:mx-4 sm:h-8" aria-hidden="true" />

          <Link
            href="/visuals"
            className="group flex h-11 items-center justify-center gap-2 overflow-visible rounded-xl border border-white/10 bg-white/[0.04] px-3 transition-all duration-300 ease-out hover:border-amber-400/40 hover:bg-white/[0.07] hover:shadow-[0_0_18px_rgba(245,158,11,0.12)] sm:h-12 sm:gap-3 sm:px-4.5 md:h-14"
            onClick={scrollTopIfSame("/visuals")}
            aria-label="Garage Visuals: fotografía y videoclips"
            aria-current={isActive("/visuals") ? "page" : undefined}
          >
            <Image
              src="/images/visuals_logo.png"
              alt=""
              width={180}
              height={60}
              sizes="(max-width: 640px) 80px, 120px"
              className="relative z-10 h-7 w-auto origin-center object-contain opacity-85 transition-all duration-300 ease-out group-hover:opacity-100 motion-safe:group-hover:scale-105 sm:h-9 md:h-10"
            />
            <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-white transition-colors duration-300 group-hover:text-amber-400 sm:text-xs md:text-sm">
              Visuals
            </span>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={scrollTopIfSame(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${
                isActive(link.href) ? "text-accent" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reservas"
            aria-current={isActive("/reservas") ? "page" : undefined}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover motion-safe:hover:scale-105"
          >
            Reservar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-lg md:hidden"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
        >
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id={menuId}
        hidden={!menuOpen}
        className="border-t border-card-border px-4 pb-4 md:hidden"
      >
        <nav aria-label="Principal móvil" className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={scrollTopIfSame(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block py-3 text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${
                isActive(link.href) ? "text-accent" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reservas"
            onClick={() => setMenuOpen(false)}
            className="mt-2 block rounded-lg bg-accent px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-accent-hover"
          >
            Reservar
          </Link>
        </nav>
      </div>
    </header>
  );
}
