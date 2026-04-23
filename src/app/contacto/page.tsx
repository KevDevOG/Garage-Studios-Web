import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contacto — Garage Studios",
  description:
    "Contacta con Garage Studios. Estamos en Las Palmas de Gran Canaria y listos para ayudarte con tu proyecto musical.",
};

export default function ContactoPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Contacto</h1>
        <p className="mt-3 text-muted">
          ¿Tienes un proyecto en mente? Cuéntanos y encontraremos la mejor
          solución para ti.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Formulario */}
        <ContactForm />

        {/* Info adicional */}
        <div className="space-y-6 rounded-xl border border-card-border bg-card-bg p-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Dirección
            </h3>
            <p className="mt-1 text-sm">Avenida Parque Central 1, Las Palmas de Gran Canaria</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              WhatsApp
            </h3>
            <p className="mt-1 text-sm">
              <a href="https://wa.me/34693489379" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">
                +34 693 48 93 79
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Email
            </h3>
            <p className="mt-1 text-sm">
              <a href="mailto:garagestudioslp@gmail.com" className="transition-colors hover:text-accent">
                garagestudioslp@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Redes Sociales
            </h3>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <a href="https://www.instagram.com/gstudios_lp/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-accent">
                <span className="text-xl">📸</span> @gstudios_lp
              </a>
              <a href="https://www.tiktok.com/@garage_studios" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-accent">
                <span className="text-xl">🎵</span> @garage_studios
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Horario
            </h3>
            <ul className="mt-1 space-y-1 text-sm text-muted">
              <li>Lunes a Viernes: 16:00 – 22:00</li>
              <li>Sábados: 10:00 – 00:00</li>
              <li>Domingos: 15:00 – 22:00</li>
            </ul>
          </div>
        </div>
      </div>
      {/* ── Mapa de Ubicación ───────────────────────────────── */}
      <div className="mt-16 rounded-xl border border-card-border bg-card-bg overflow-hidden animate-slide-up delay-300 shadow-xl">
        {/* Map Header */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-card-border">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary text-2xl">📍</span> Dónde estamos
            </h2>
            <p className="mt-2 text-muted">Avenida Parque Central 1, Las Palmas de Gran Canaria</p>
          </div>
          <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex justify-center items-center gap-2 rounded-lg border border-card-border bg-transparent px-6 py-3 font-semibold text-white transition-all hover:bg-white/5"
            >
              Ver en Google Maps
            </a>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex justify-center items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(30,58,138,0.4)]"
            >
              Cómo llegar
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        
        {/* Google Maps Iframe */}
        <div className="h-[400px] w-full bg-black/50 relative">
          <iframe
            src="https://maps.google.com/maps?q=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria&t=k&z=18&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 grayscale opacity-70 transition-all hover:grayscale-0 hover:opacity-100 duration-500"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
