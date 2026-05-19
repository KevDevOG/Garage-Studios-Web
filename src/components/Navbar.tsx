"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "El Estudio" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleVisualsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/visuals") {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logos */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <Link href="/" className="flex items-center" onClick={handleLogoClick}>
            <Image 
              src="/images/logo-sin-fondo.png" 
              alt="Garage Studios Logo" 
              width={200} 
              height={60} 
              className="h-8 w-auto object-contain sm:h-10 md:h-14"
              priority
            />
          </Link>
          
          <div className="mx-2 sm:mx-4 h-6 sm:h-8 w-px bg-white/10"></div>
          
          <Link 
            href="/visuals" 
            className="group flex h-11 sm:h-12 md:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 sm:px-4.5 transition-all duration-300 ease-out hover:border-amber-400/40 hover:bg-white/[0.07] hover:shadow-[0_0_18px_rgba(245,158,11,0.12)] overflow-visible" 
            onClick={handleVisualsClick} 
            aria-label="Garage Visuals"
            title="Ir a Garage Visuals"
          >
            <Image 
              src="/images/visuals_logo.png" 
              alt="Garage Visuals" 
              width={180} 
              height={60} 
              className="relative z-10 h-7 sm:h-9 md:h-10 w-auto origin-center object-contain opacity-85 transition-all duration-300 ease-out group-hover:scale-105 group-hover:opacity-100" 
              priority 
            />
            <span className="relative z-10 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest text-white transition-colors duration-300 group-hover:text-amber-400">
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
              onClick={(e) => {
                if (link.href === "/" && pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }
              }}
              className={`text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${pathname === link.href ? "text-accent" : "text-muted"
                }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reservas"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover hover:scale-105"
          >
            Reservar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menú"
        >
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-card-border px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                setMenuOpen(false);
                if (link.href === "/" && pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }
              }}
              className={`block py-3 text-sm font-black uppercase tracking-widest transition-colors hover:text-accent ${pathname === link.href ? "text-accent" : "text-muted"
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
        </div>
      )}
    </nav>
  );
}
