import Image from "next/image";

interface GalleryCardProps {
  item: {
    id: string;
    titulo: string;
    descripcion?: string | null;
    url_imagen: string;
  };
  /** Prioriza la carga (primeras tarjetas visibles sin scroll). */
  priority?: boolean;
}

export default function GalleryCard({ item, priority = false }: GalleryCardProps) {
  return (
    <figure className="group relative overflow-hidden rounded-xl border border-card-border transition-all duration-500 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] motion-safe:hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-card-bg">
        <Image
          src={item.url_imagen}
          alt={item.titulo || "Garage Studios"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-110"
        />
        {/* Gradiente inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />

        {/* Información sobrepuesta */}
        <figcaption className="absolute bottom-0 left-0 right-0 flex translate-y-3 flex-col justify-end p-5 transition-transform duration-500 group-hover:translate-y-0 motion-reduce:translate-y-0">
          <div className="mb-1 h-0.5 w-10 bg-accent transition-all duration-500 group-hover:w-full" />
          <h3 className="text-sm font-bold uppercase tracking-tight text-white">{item.titulo}</h3>
          {item.descripcion && (
            <p className="mt-1 text-xs font-medium text-gray-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:opacity-100">
              {item.descripcion}
            </p>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
