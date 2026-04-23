import type { Metadata } from "next";
import Image from "next/image";
import ServiceCard from "@/components/ServiceCard";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Garage Visuals — Garage Studios",
  description:
    "La división audiovisual de Garage Studios. Producción de videoclips, sesiones de fotos y contenido para redes.",
};

export default async function VisualsPage() {
  const dbServices = await getActiveServices();

  // Mapear de la base de datos al formato visual
  const mappedServices = dbServices.map(s => ({
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    price: s.precio + " €",
    duration: s.duracion_minutos ? s.duracion_minutos + " min" : undefined,
    icon: s.icono,
    category: s.categoria,
    subcategory: s.subcategoria,
    isPack: s.es_pack
  }));

  const getByCategory = (cat: string) => mappedServices.filter(s => s.category === cat);
  const getBySubcat = (subcat: string) => mappedServices.filter(s => s.subcategory === subcat);

  // Filtrar específicamente los servicios visuales
  const fotoVideo = getByCategory("Fotografía y vídeo");
  const edicionVisual = getByCategory("Diseño").filter(s => s.name.toLowerCase().includes("videoclip"));
  const packsVisuals = getBySubcat("Garage Visuals");

  const hasServices = fotoVideo.length > 0 || edicionVisual.length > 0 || packsVisuals.length > 0;

  if (!hasServices) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-32 sm:px-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl mb-4 text-primary">Garage Visuals</h1>
        <div className="inline-block rounded-2xl border border-card-border bg-card-bg p-8 shadow-lg">
          <span className="text-5xl">🎬</span>
          <h2 className="mt-4 text-xl font-semibold text-white">Actualizando Catálogo</h2>
          <p className="mt-2 text-muted max-w-md mx-auto">
            Estamos subiendo los nuevos servicios y promociones de nuestra división audiovisual.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      {/* ── Background Visuals Hero ────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 h-[450px] z-[-2] rounded-b-3xl overflow-hidden mx-4 sm:mx-6 shadow-xl shadow-background/50">
        <Image
          src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941365889-b337d7bb-26e0-4157-b82b-5640ab043ec5.jpg"
          alt="Garage Visuals Environment"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/80 to-background"></div>
      </div>

      {/* Encabezado Visuals */}
      <div className="mb-20 mt-12 text-center sm:mt-16">
        <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider backdrop-blur-md border border-primary/20 shadow-lg">
          División Audiovisual
        </span>
        <h1 className="text-4xl font-black sm:text-5xl lg:text-6xl tracking-tight mt-2 text-white drop-shadow-xl">
          Garage <span className="text-primary drop-shadow-[0_0_15px_rgba(30,58,138,0.8)]">Visuals</span>
        </h1>
        <p className="mt-6 text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-md sm:text-xl">
          Elevamos tu imagen al mismo nivel que tu sonido. Ofrecemos producción de videoclips, sesiones fotográficas y contenido dinámico para redes.
        </p>
      </div>

      {/* ── PRODUCCIÓN VISUAL ────────────────────────────────── */}
      {(fotoVideo.length > 0 || edicionVisual.length > 0) && (
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold border-b border-card-border pb-3 flex items-center gap-2">
            <span>🎥</span> Fotografía, Vídeo y Edición
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fotoVideo.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
            {edicionVisual.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* ── PACKS VISUALS ───────────────────────────────────────── */}
      {packsVisuals.length > 0 && (
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-card-bg via-card-bg to-primary/15 p-6 sm:p-10 border border-primary/30 shadow-[0_0_40px_rgba(30,58,138,0.15)]">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md">🎬 Packs Garage Visuals</h2>
            <p className="mt-2 text-gray-300">Soluciones integrales para que no tengas que preocuparte de nada.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packsVisuals.map(service => (
              <ServiceCard key={service.id} service={service} featured={true} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
