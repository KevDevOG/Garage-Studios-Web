import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-4 pb-20 text-center sm:pt-6 sm:pb-32">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-[-2]">
        <Image
          src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941347466-cf14b757-064e-4743-83b4-ce1b9763b829.jpg"
          alt="Garage Studios - Estudio de Grabación"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50"
        />
      </div>

      {/* Overlay oscuro para garantizar legibilidad del texto siempre */}
      <div className="absolute inset-0 z-[-1] bg-black/40"></div>
      {/* Overlay de degradado para fusionar suavemente con el fondo de la página */}
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent via-transparent to-background"></div>

      {/* Contenido (con animaciones de entrada) */}
      <div className="relative z-10 max-w-4xl animate-slide-up opacity-0">
        {/* Logo Real */}
        <div className="mb-4 flex justify-center">
          <Image
            src="/images/logo-sin-fondo.png"
            alt="Garage Studios Logo"
            width={1000}
            height={400}
            className="h-auto w-full max-w-[240px] object-contain sm:max-w-[380px] md:max-w-[500px]"
            priority
          />
        </div>

        {/* Ubicación */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-widest text-accent uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          Las Palmas de Gran Canaria
        </div>

        {/* Título */}
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl drop-shadow-2xl uppercase italic">
          Donde el <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">sonido</span> cobra vida
        </h1>

        {/* Descripción */}
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-200 sm:text-xl drop-shadow">
          Todo empezó en un garage. Un espacio enfocado en apoyar a artistas emergentes.
          Creemos que todo el mundo puede hacer música.
        </p>

        {/* Botones CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Link
            href="/reservas"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-10 py-5 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            <span>RESERVAR AHORA</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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

