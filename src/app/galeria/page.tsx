import type { Metadata } from "next";
import GalleryCard from "@/components/GalleryCard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Galería — Garage Studios",
  description:
    "Explora nuestro estudio musical: salas de grabación, equipamiento profesional y sesiones en vivo.",
};

export default async function GaleriaPage() {
  const supabase = await createClient();

  const { data: imagenes } = await supabase
    .from("imagen")
    .select("id, titulo, descripcion, url_imagen")
    .order("created_at", { ascending: false });

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
      {!imagenes || imagenes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-4 text-muted">
            Estamos preparando nuestra galería. ¡Vuelve pronto!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {imagenes.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
