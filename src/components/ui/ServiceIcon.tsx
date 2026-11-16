import Image from "next/image";

interface ServiceIconProps {
  /** URL de icono (local o Supabase Storage). Puede ser un GIF animado. */
  iconUrl?: string | null;
  /** Emoji o texto alternativo cuando no hay URL. */
  fallback?: string | null;
  /** Nombre del servicio para el texto alternativo. */
  name: string;
  /** Tamaño en píxeles (ancho = alto). */
  size?: number;
  className?: string;
}

/**
 * Icono de servicio compartido por la home, /servicios y /visuals.
 * Los GIF animados se sirven sin optimizar (Next no puede re-codificarlos)
 * pero con carga diferida y decodificación asíncrona.
 */
export default function ServiceIcon({
  iconUrl,
  fallback,
  name,
  size = 64,
  className = "",
}: ServiceIconProps) {
  if (iconUrl) {
    const isGif = /\.gif($|\?)/i.test(iconUrl);
    return (
      <Image
        src={iconUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        unoptimized={isGif}
        loading="lazy"
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span aria-hidden="true" title={name} className={className}>
      {fallback || "🎵"}
    </span>
  );
}
