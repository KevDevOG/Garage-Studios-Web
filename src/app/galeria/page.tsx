import type { Metadata } from "next";
import GalleryCard from "@/components/GalleryCard";
import ScrollReveal from "@/components/ScrollReveal";
import { getPublicGalleryImages } from "@/app/actions/gallery-public";

export const metadata: Metadata = {
  title: "Galería del Estudio de Grabación en Las Palmas | Garage Studios",
  description:
    "Explora Garage Studios por dentro: sala de grabación, equipamiento profesional y el ambiente donde grabamos en Las Palmas de Gran Canaria.",
  alternates: { canonical: "/galeria" },
  openGraph: {
    title: "Galería del Estudio | Garage Studios",
    description:
      "Explora Garage Studios por dentro: sala de grabación, equipamiento profesional y el ambiente donde grabamos en Las Palmas de Gran Canaria.",
    url: "https://garagestudios.es/galeria",
    siteName: "Garage Studios",
    locale: "es_ES",
    type: "website",
    images: [{ url: "/og-garage-studios.png", width: 1200, height: 630, alt: "Garage Studios" }],
  },
};

// Página estática con revalidación cada hora; las subidas desde el panel
// llaman a revalidatePath("/galeria").
export const revalidate = 3600;

export default async function GaleriaPage() {
  const imagenes = await getPublicGalleryImages();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-20 text-center animate-fade-in">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter sm:text-6xl">Nuestro <span className="text-accent">Estudio</span></h1>
        <div className="mx-auto mt-6 h-1.5 w-24 bg-accent"></div>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-muted">
          Un vistazo al equipo, la técnica y la atmósfera donde el talento local se transforma en sonido profesional.
        </p>
      </div>

      {/* Grid de imágenes */}
      {imagenes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl" aria-hidden="true">📷</p>
          <p className="mt-4 text-muted">
            Estamos preparando nuestra galería. ¡Vuelve pronto!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {imagenes.map((item, idx) => (
            <ScrollReveal key={item.id} delay={Math.min(idx, 7) * 0.05} distance={24} duration={0.6}>
              <GalleryCard item={item} priority={idx < 4} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}
