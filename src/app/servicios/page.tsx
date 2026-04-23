import type { Metadata } from "next";
import ServiceCard, { type ServiceDisplay } from "@/components/ServiceCard";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Servicios — Garage Studios",
  description:
    "Descubre nuestros servicios de grabación, mezcla, masterización, producción musical y nuestros packs completos.",
};

export default async function ServiciosPage() {
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

  const getByCategory = (cat: string) => mappedServices.filter(s => s.category === cat);
  const getBySubcat = (subcat: string) => mappedServices.filter(s => s.subcategory === subcat);

  const sonido = getByCategory("Sonido");
  const diseno = getByCategory("Diseño").filter(s => !s.name.toLowerCase().includes("videoclip"));
  
  const packsGST = getBySubcat("Planes GST");
  const packsSonido = getBySubcat("Packs Sonido");
  const packsDiseno = getBySubcat("Pack Diseño");

  const hasPacks = packsGST.length > 0 || packsSonido.length > 0 || packsDiseno.length > 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-16 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Nuestros Servicios</h1>
        <p className="mt-3 text-muted">
          Ofrecemos todo lo que necesitas para crear, grabar y pulir tu música.
          Elige el servicio que mejor se adapte a tu proyecto.
        </p>
      </div>

      {/* ── SONIDO ────────────────────────────────────────────── */}
      {sonido.length > 0 && (
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold border-b border-card-border pb-3 flex items-center gap-2">
            <span>🎧</span> Sonido
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sonido.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}



      {/* ── DISEÑO ────────────────────────────────────────────── */}
      {diseno.length > 0 && (
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold border-b border-card-border pb-3 flex items-center gap-2">
            <span>🎨</span> Diseño
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {diseno.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* ── PACKS ─────────────────────────────────────────────── */}
      {hasPacks && (
        <div className="mb-16 rounded-3xl bg-gradient-to-br from-card-bg via-card-bg to-primary/10 p-6 sm:p-10 border border-primary/20 shadow-[0_0_40px_rgba(30,58,138,0.1)]">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md">💎 Packs Completos</h2>
            <p className="mt-2 text-gray-300">Las mejores opciones para lanzar tu proyecto al siguiente nivel con la mejor relación calidad-precio.</p>
          </div>

          {/* Planes GST */}
          {packsGST.length > 0 && (
            <div className="mb-12">
              <h3 className="mb-6 text-xl font-bold text-primary flex items-center gap-2">
                <span>🚀</span> Planes GST
              </h3>
              <div className="grid gap-6 sm:grid-cols-3">
                {packsGST.map(service => (
                  <ServiceCard key={service.id} service={service} featured={true} />
                ))}
              </div>
            </div>
          )}
          
          {/* Packs Sonido */}
          {packsSonido.length > 0 && (
            <div className="mb-12">
              <h3 className="mb-6 text-xl font-bold text-primary flex items-center gap-2">
                <span>🎧</span> Packs Sonido
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packsSonido.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}



          {/* Pack Diseño */}
          {packsDiseno.length > 0 && (
            <div>
              <h3 className="mb-6 text-xl font-bold text-primary flex items-center gap-2">
                <span>🎨</span> Pack Diseño
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packsDiseno.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
