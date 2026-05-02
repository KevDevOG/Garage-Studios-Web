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
    <div className="group relative overflow-hidden rounded-xl border border-card-border transition-all duration-500 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="relative aspect-square overflow-hidden bg-card-bg">
        <img
          src={item.url_imagen}
          alt={item.titulo}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradiente inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90"></div>
        
        {/* Información sobrepuesta */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end translate-y-3 transition-transform duration-500 group-hover:translate-y-0">
          <div className="mb-1 h-0.5 w-10 bg-accent transition-all duration-500 group-hover:w-full"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-tight">{item.titulo}</h3>
          {item.descripcion && (
            <p className="mt-1 text-xs font-medium text-gray-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              {item.descripcion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
