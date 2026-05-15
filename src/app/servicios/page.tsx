import type { Metadata } from "next";
import ServiceCard, { type ServiceDisplay } from "@/components/ServiceCard";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Servicios — Garage Studios",
  description:
    "Grabación, beats, fotografía y videoclips profesionales. Descubre todos los servicios y precios de Garage Studios.",
};

// Definición de categorías: orden, título visual e icono decorativo
const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "Grabación",  label: "Grabación & Producción", emoji: "🎙️" },
  { key: "Beats",      label: "Beats / Instrumentales",  emoji: "🎵" },
  { key: "Fotografía", label: "Fotografía",               emoji: "📷" },
  { key: "Videoclips", label: "Videoclips",               emoji: "🎬" },
];

export default async function ServiciosPage() {
  const dbServices = await getActiveServices();

  // Mapear de la base de datos al formato visual del componente ServiceCard
  const mappedServices: ServiceDisplay[] = dbServices.map(s => ({
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    price: s.precio + " €",
    duration: s.duracion_minutos ? s.duracion_minutos + " min" : undefined,
    icon: s.icono,
    category: s.categoria,
    subcategory: s.subcategoria,
    isPack: s.es_pack,
  }));

  if (mappedServices.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-32 sm:px-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl mb-4">Nuestros Servicios</h1>
        <div className="inline-block rounded-2xl border border-card-border bg-card-bg p-8 shadow-lg">
          <span className="text-5xl">🚧</span>
          <h2 className="mt-4 text-xl font-semibold text-white">Estamos actualizando nuestro catálogo</h2>
          <p className="mt-2 text-muted max-w-md mx-auto">
            Vuelve pronto para descubrir todos los servicios, packs y promociones que estamos preparando para tu música.
          </p>
        </div>
      </section>
    );
  }

  const getByCategory = (cat: string) =>
    mappedServices.filter(s => s.category === cat);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-24 text-center animate-fade-in">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter sm:text-6xl">
          Nuestros <span className="text-accent">Servicios</span>
        </h1>
        <div className="mx-auto mt-6 h-1.5 w-24 bg-accent"></div>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-muted">
          Grabación, producción, fotografía y videoclips profesionales. Elige el servicio que mejor se adapte a tu proyecto.
        </p>
      </div>

      {/* Una sección por cada categoría oficial */}
      {CATEGORIES.map(({ key, label, emoji }) => {
        const items = getByCategory(key);
        if (items.length === 0) return null;

        // Los packs se destacan con featured; el resto se muestra normal
        const packs   = items.filter(s => s.isPack);
        const singles = items.filter(s => !s.isPack);

        return (
          <div key={key} className="mb-20">
            {/* Título de categoría */}
            <h2 className="mb-10 text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <span className="h-8 w-2 bg-accent shrink-0"></span>
              <span>{emoji} {label}</span>
            </h2>

            {/* Servicios individuales */}
            {singles.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {singles.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}

            {/* Packs destacados dentro de la misma categoría */}
            {packs.length > 0 && (
              <div className={singles.length > 0 ? "mt-8" : ""}>
                {singles.length > 0 && (
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
                    💎 Packs especiales
                  </p>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {packs.map(service => (
                    <ServiceCard key={service.id} service={service} featured={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
