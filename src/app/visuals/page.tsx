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
      <div className="mb-20 mt-12 text-center sm:mt-16 animate-fade-in">
        <span className="mb-6 inline-block rounded-full border border-accent/30 bg-accent/10 px-6 py-1.5 text-xs font-bold uppercase tracking-widest text-accent backdrop-blur-md shadow-lg">
          Audiovisual Division
        </span>
        <h1 className="text-5xl font-black uppercase italic tracking-tighter sm:text-6xl lg:text-7xl text-white drop-shadow-2xl">
          Garage <span className="text-accent drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">Visuals</span>
        </h1>
        <div className="mx-auto mt-6 h-1.5 w-24 bg-accent"></div>
        <p className="mt-10 text-lg font-medium leading-relaxed text-gray-200 max-w-2xl mx-auto drop-shadow-md sm:text-xl">
          Elevamos tu imagen al mismo nivel que tu sonido. Videoclips en 4K, sesiones fotográficas de alta gama y contenido estratégico para redes.
        </p>
      </div>

      {/* ── PRODUCCIÓN VISUAL ────────────────────────────────── */}
      {(fotoVideo.length > 0 || edicionVisual.length > 0) && (
        <div className="mb-12">
          <h2 className="mb-10 text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <span className="h-8 w-2 bg-accent"></span> Producción Visual
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
        <div className="mb-24 rounded-[2rem] bg-gradient-to-br from-card-bg via-card-bg to-accent/5 p-8 sm:p-16 border border-accent/20 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">🎬 Packs Garage Visuals</h2>
            <p className="mt-4 text-gray-400 font-medium">Soluciones integrales diseñadas para que no tengas que preocuparte de nada.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {packsVisuals.map(service => (
              <ServiceCard key={service.id} service={service} featured={true} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
