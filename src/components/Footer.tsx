import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-card-border bg-card-bg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        {/* Marca */}
        <div>
          <Link href="/" className="inline-block mb-4">
            <Image 
              src="/images/logo-sin-fondo.png" 
              alt="Garage Studios Logo" 
              width={200} 
              height={70} 
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="text-sm font-medium italic text-accent">
            &ldquo;Music = Life&rdquo;
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Grabación y producción musical profesional. Urbano, trap, rap, reggaeton, bachata, salsa, drill y R&B.
          </p>
        </div>

        {/* Links rápidos */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Navegación
          </h2>
          <nav aria-label="Pie de página">
            <ul className="space-y-2 text-sm">
              {[
                { href: "/", label: "Inicio" },
                { href: "/servicios", label: "Servicios" },
                { href: "/galeria", label: "El Estudio" },
                { href: "/visuals", label: "Garage Visuals" },
                { href: "/contacto", label: "Contacto" },
                { href: "/reservas", label: "Reservar" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block py-1 text-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Contacto */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Contacto
          </h2>
          <address className="not-italic">
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a
                  href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 transition-colors hover:text-accent"
                >
                  C. Drago, 35010 Las Palmas de Gran Canaria
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href="tel:+34661652638" className="inline-block py-1 transition-colors hover:text-accent">
                  661 652 638
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href="mailto:garagestudioslp@gmail.com" className="inline-block py-1 transition-colors hover:text-accent">
                  garagestudioslp@gmail.com
                </a>
              </li>
            </ul>
          </address>
          <div className="mt-4 flex gap-4 text-sm text-muted">
            <a href="https://www.instagram.com/gstudios_lp/" target="_blank" rel="noopener noreferrer" className="inline-block py-1 transition-colors hover:text-accent">
              Instagram
            </a>
            <a href="https://www.tiktok.com/@garage_studios" target="_blank" rel="noopener noreferrer" className="inline-block py-1 transition-colors hover:text-accent">
              TikTok
            </a>
          </div>
        </div>
      </div>

      {/* Copyright y Legal */}
      <div className="border-t border-card-border px-4 py-6 text-xs text-muted">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright (Left on desktop) */}
          <div className="text-center md:text-left">
            <span>© {new Date().getFullYear()} Garage Studios. Todos los derechos reservados.</span>
          </div>

          {/* Legal Links (Center on desktop) */}
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/aviso-legal" className="inline-block py-1 transition-colors hover:text-white">Aviso Legal</Link>
            <span className="hidden text-card-border md:inline" aria-hidden="true">|</span>
            <Link href="/privacidad" className="inline-block py-1 transition-colors hover:text-white">Política de Privacidad</Link>
            <span className="hidden text-card-border md:inline" aria-hidden="true">|</span>
            <Link href="/cookies" className="inline-block py-1 transition-colors hover:text-white">Política de Cookies</Link>
          </nav>

          {/* Credit Link (Right on desktop) */}
          <div className="text-center text-[11px] text-muted md:text-right">
            Web desarrollada por{" "}
            <a
              href="https://iamkevdev.es"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1 transition-colors hover:text-accent hover:underline"
            >
              Kev Dev
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
