import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Camera, Music, MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto — Garage Studios",
  description:
    "Contacta con Garage Studios. Estamos en Las Palmas de Gran Canaria y listos para ayudarte con tu proyecto musical.",
};

export default function ContactoPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-20 text-center animate-fade-in">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter sm:text-6xl">Hablemos de tu <span className="text-accent">Sonido</span></h1>
        <div className="mx-auto mt-6 h-1.5 w-24 bg-accent"></div>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-muted">
          ¿Listo para subir de nivel? Cuéntanos tu proyecto y encontraremos la mejor solución para ti.
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
            <p className="mt-1 text-sm">C. Drago, 35010 Las Palmas de Gran Canaria, Las Palmas</p>
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
              <a href="https://www.instagram.com/gstudios_lp/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-accent group">
                <Camera className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" /> @gstudios_lp
              </a>
              <a href="https://www.tiktok.com/@garage_studios" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-accent group">
                <Music className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" /> @garage_studios
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
      <div className="mt-24 rounded-2xl border border-card-border bg-card-bg overflow-hidden animate-slide-up delay-300 shadow-2xl">
        {/* Map Header */}
        <div className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 border-b border-card-border">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <MapPin className="w-8 h-8 text-accent" /> Ubicación
            </h2>
            <p className="mt-2 text-sm font-medium text-muted">C. Drago, 35010 Las Palmas de Gran Canaria, Las Palmas</p>
          </div>
          <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4">
            <a
              href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex justify-center items-center gap-2 rounded-full border border-card-border bg-transparent px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/5"
            >
              Ver en Google Maps
            </a>
            <a
              href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex justify-center items-center gap-2 rounded-full bg-accent px-8 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
            >
              Cómo llegar
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        
        {/* Google Maps Iframe */}
        <div className="h-[400px] w-full bg-black/50 relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3519.2068559041677!2d-15.45431782387618!3d28.109726607628502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xc40957fdb7a8903%3A0x8f5d83a7d7675671!2sGarage%20Studios!5e0!3m2!1ses!2ses!4v1777767285936!5m2!1ses!2ses"
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
