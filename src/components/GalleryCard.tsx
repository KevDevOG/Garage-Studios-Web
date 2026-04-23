interface GalleryCardProps {
  item: {
    id: string;
    titulo: string;
    descripcion?: string | null;
    url_imagen: string;
  };
}

export default function GalleryCard({ item }: GalleryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-card-border transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(30,58,138,0.15)]">
      <div className="relative aspect-square overflow-hidden bg-black/40">
        <img
          src={item.url_imagen}
          alt={item.titulo}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradiente inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"></div>
        
        {/* Información sobrepuesta */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
          <h3 className="text-sm font-semibold text-white drop-shadow-md">{item.titulo}</h3>
          {item.descripcion && (
            <p className="mt-1 text-xs text-gray-300 opacity-0 transition-opacity duration-500 group-hover:opacity-100 drop-shadow-md">
              {item.descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
