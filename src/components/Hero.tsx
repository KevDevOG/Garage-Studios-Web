import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const HERO_IMAGE =
  "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941347466-cf14b757-064e-4743-83b4-ce1b9763b829.jpg";

/**
 * Hero de la home. Es el elemento LCP de la web: la imagen de fondo lleva
 * `priority` y `fetchPriority="high"`; el resto de la página entra con la
 * animación de marca (translate + opacity, respetando reduced-motion).
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 pt-4 pb-20 text-center sm:pt-6 sm:pb-32"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-[-2]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          quality={70}
          sizes="100vw"
          className="object-cover object-center opacity-50"
        />
      </div>

      {/* Overlay oscuro para garantizar legibilidad del texto siempre */}
      <div className="absolute inset-0 z-[-1] bg-black/40" />
      {/* Overlay de degradado para fusionar suavemente con el fondo de la página */}
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Contenido (con animación de entrada) */}
      <div className="relative z-10 max-w-4xl animate-slide-up motion-safe:opacity-0">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <Image
            src="/images/logo-sin-fondo.png"
            alt="Garage Studios"
            width={1000}
            height={400}
            sizes="(max-width: 640px) 240px, (max-width: 768px) 380px, 500px"
            className="h-auto w-full max-w-[240px] object-contain sm:max-w-[380px] md:max-w-[500px]"
            priority
          />
        </div>

        {/* Ubicación */}
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Las Palmas de Gran Canaria
        </p>

        {/* Título */}
        <h1
          id="hero-title"
          className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-2xl sm:text-5xl lg:text-6xl"
        >
          Estudio de grabación en{" "}
          <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            Las Palmas de Gran Canaria
          </span>
        </h1>

        {/* Descripción */}
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-200 drop-shadow sm:text-xl">
          Para artistas que buscan un estudio musical con sonido profesional, producción musical
          completa y videoclips de la mejor calidad.
        </p>

        {/* Botones CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            href="/reservas"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-10 py-5 text-lg font-bold text-black transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] motion-safe:hover:scale-105"
          >
            <span>RESERVAR AHORA</span>
            <ChevronRight
              className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/servicios"
            className="rounded-full border-2 border-white/20 bg-white/5 px-10 py-5 text-lg font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
          >
            VER SERVICIOS
          </Link>
        </div>
      </div>
    </section>
  );
}
