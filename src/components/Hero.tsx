import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
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
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent via-background/50 to-background"></div>

      {/* Contenido (con animaciones de entrada) */}
      <div className="animate-slide-up opacity-0">
        {/* Ubicación */}
        <p className="mb-4 text-sm font-semibold tracking-wider text-accent uppercase">
          📍 Las Palmas de Gran Canaria, Zona La Ballena
        </p>

        {/* Título */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl drop-shadow-lg">
          Donde el <span className="text-primary drop-shadow-[0_0_15px_rgba(30,58,138,0.8)]">talento local</span> cobra vida
        </h1>

        {/* Descripción */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-200 sm:text-xl drop-shadow">
          Todo empezó en un garage. Un espacio enfocado en apoyar a artistas emergentes. 
          Creemos que todo el mundo puede hacer música.
        </p>

        {/* Botones CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/servicios"
            className="rounded-lg border border-primary px-8 py-4 text-base font-semibold text-white transition-all hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(30,58,138,0.3)]"
          >
            Ver servicios
          </Link>
          <Link
            href="/reservas"
            className="rounded-lg bg-accent px-8 py-4 text-base font-semibold text-black shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          >
            Reservar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}

