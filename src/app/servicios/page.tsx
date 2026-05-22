import type { Metadata } from "next";
import ServiceCard, { type ServiceDisplay } from "@/components/ServiceCard";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Servicios de Grabación y Producción Musical en Las Palmas | Garage Studios",
  description:
    "Explora nuestros servicios de grabación de voz, producción musical completa, creación de beats, mezcla, masterización y videoclips profesionales en Las Palmas.",
};

import { Mic, Music, Camera, Clapperboard, Hammer, Diamond } from "lucide-react";

// Definición de categorías: orden, título visual e icono decorativo
const CATEGORIES = [
  { key: "Grabación",    label: "Grabación & Producción", icon: Mic },
  { key: "Beats",        label: "Beats / Instrumentales",  icon: Music },
  { key: "Packs Sonido", label: "Packs de Sonido",         icon: Diamond },
  { key: "Fotografía",   label: "Fotografía",               icon: Camera },
  { key: "Videoclips",   label: "Videoclips",               icon: Clapperboard },
  { key: "Packs",        label: "Packs Especiales",        icon: Diamond },
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
    iconUrl: s.icono_url,
    category: s.categoria,
    subcategory: s.subcategoria,
    isPack: s.es_pack,
  }));

  if (mappedServices.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-32 sm:px-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl mb-4">Nuestros Servicios</h1>
        <div className="inline-block rounded-2xl border border-card-border bg-card-bg p-8 shadow-lg">
          <Hammer className="w-16 h-16 text-accent mx-auto mb-4" />
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
          Servicios profesionales de grabación de voz e instrumentos, producción musical, creación de beats, mezcla, masterización y videoclips en Las Palmas. Todo lo que tu música necesita.
        </p>
      </div>

      {/* Una sección por cada categoría oficial */}
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const items = getByCategory(key);
        if (items.length === 0) return null;

        // Los packs se destacan con featured; el resto se muestra normal
        const packs   = items.filter(s => s.isPack);
        const singles = items.filter(s => !s.isPack);

        return (
          <div key={key} className="mb-20">
            {/* Título de categoría */}
            <h2 className="mb-10 text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <span className="flex items-center gap-2">
                <Icon className="w-8 h-8 text-accent" />
                {label}
              </span>
            </h2>

            {/* Packs destacados al principio de la categoría */}
            {packs.length > 0 && (
              <div className="mb-10">
                {!label.toLowerCase().includes("pack") && singles.length > 0 && (
                  <div className="mb-8 flex items-center gap-3">
                    <Diamond className="w-4 h-4 text-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Packs especiales</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
                  </div>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {packs.map(service => (
                    <ServiceCard key={service.id} service={service} featured={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Servicios individuales después de los packs */}
            {singles.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {singles.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
