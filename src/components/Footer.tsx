import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-card-border bg-card-bg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        {/* Marca */}
        <div>
          <h3 className="text-lg font-bold">
            🎸 <span className="text-accent">Garage</span> Studios
          </h3>
          <p className="mt-2 text-sm font-medium italic text-gray-300">
            "Music = Life"
          </p>
          <p className="mt-2 text-sm text-muted">
            Grabación y producción musical. Urbano, trap, rap, reggaeton, bachata, salsa, drill y R&B.
          </p>
        </div>

        {/* Links rápidos */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Navegación
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/", label: "Inicio" },
              { href: "/servicios", label: "Servicios" },
              { href: "/galeria", label: "Galería" },
              { href: "/contacto", label: "Contacto" },
              { href: "/reservas", label: "Reservar" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Contacto
          </h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>📍 Avenida Parque Central 1, Las Palmas</li>
            <li>📞 +34 693 48 93 79</li>
            <li>✉️ garagestudioslp@gmail.com</li>
          </ul>
          <div className="mt-4 flex gap-4 text-muted">
            <a href="https://www.instagram.com/gstudios_lp/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-accent transition-colors">
              Instagram
            </a>
            <a href="https://www.tiktok.com/@garage_studios" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-accent transition-colors">
              TikTok
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-card-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Garage Studios. Todos los derechos
        reservados.
      </div>
    </footer>
  );
}
