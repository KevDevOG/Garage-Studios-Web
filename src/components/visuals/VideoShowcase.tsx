"use client";

import { useState, useEffect } from "react";
import { Play, X, ExternalLink, Film } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

interface VideoItem {
  title: string;
  artist: string;
  youtubeUrl: string;
  embedUrl: string;
  thumbnail: string;
  description: string;
}

const youtubeWorks: VideoItem[] = [
  {
    title: "Patryx PMA - Par De Horas",
    artist: "Patryx PMA",
    youtubeUrl: "https://www.youtube.com/watch?v=sMbCTKG4fjU",
    embedUrl: "https://www.youtube.com/embed/sMbCTKG4fjU",
    thumbnail: "https://img.youtube.com/vi/sMbCTKG4fjU/maxresdefault.jpg",
    description: "Videoclip realizado por Garage Visuals.",
  },
  {
    title: "TAYL3R - PIM PIAO",
    artist: "TAYL3R",
    youtubeUrl: "https://www.youtube.com/watch?v=1Gx1-VzdxkU",
    embedUrl: "https://www.youtube.com/embed/1Gx1-VzdxkU",
    thumbnail: "https://img.youtube.com/vi/1Gx1-VzdxkU/maxresdefault.jpg",
    description: "Videoclip realizado por Garage Visuals.",
  },
  {
    title: "TAYL3R - NO LES SALE ASÍ",
    artist: "TAYL3R",
    youtubeUrl: "https://www.youtube.com/watch?v=DbbvHYQbl04",
    embedUrl: "https://www.youtube.com/embed/DbbvHYQbl04",
    thumbnail: "https://img.youtube.com/vi/DbbvHYQbl04/maxresdefault.jpg",
    description: "Videoclip realizado por Garage Visuals.",
  },
  {
    title: "Horas De Mentir",
    artist: "Soba",
    youtubeUrl: "https://www.youtube.com/watch?v=8t6ZW5AuEOw",
    embedUrl: "https://www.youtube.com/embed/8t6ZW5AuEOw",
    thumbnail: "https://img.youtube.com/vi/8t6ZW5AuEOw/maxresdefault.jpg",
    description: "Videoclip realizado por Garage Visuals.",
  },
  {
    title: "Tu Pelo",
    artist: "Lejii",
    youtubeUrl: "https://www.youtube.com/watch?v=3E2dxTtYHXY",
    embedUrl: "https://www.youtube.com/embed/3E2dxTtYHXY",
    thumbnail: "https://img.youtube.com/vi/3E2dxTtYHXY/maxresdefault.jpg",
    description: "Videoclip realizado por Garage Visuals.",
  },
];

export default function VideoShowcase() {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [animate, setAnimate] = useState(false);

  const handleOpen = (video: VideoItem) => {
    setActiveVideo(video);
    // Retrasar ligeramente la activación de la animación para permitir la transición de entrada
    setTimeout(() => {
      setAnimate(true);
    }, 30);
  };

  const handleClose = () => {
    setAnimate(false);
    // Esperar a que termine la animación de salida (250ms) antes de desmontar
    setTimeout(() => {
      setActiveVideo(null);
    }, 250);
  };

  // Escuchar tecla Escape para cerrar el modal de forma animada
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    if (activeVideo) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  return (
    <section id="trabajos" className="relative w-full bg-[#0a0a0a] text-white py-24 sm:py-32 overflow-hidden border-b border-white/5">
      {/* Patrón de fondo sutil */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      ></div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        
        {/* Cabecera de la sección */}
        <ScrollReveal>
          <div className="mb-16 text-center sm:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent shadow-sm">
              <Film className="w-3.5 h-3.5" /> Últimos lanzamientos
            </span>
            <h2 className="mt-4 text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-white">
              VIDEOS <span className="text-accent">AUDIOVISUALES</span>
            </h2>
            <div className="mt-4 h-1 w-20 bg-accent hidden sm:block"></div>
            <p className="mt-6 text-gray-400 font-medium max-w-2xl text-base sm:text-lg">
              Videoclips y piezas audiovisuales creadas para artistas y proyectos reales.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid del Portfolio */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {youtubeWorks.map((work, index) => (
            <ScrollReveal key={index} delay={index * 0.1} distance={30}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(work)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpen(work);
                  }
                }}
                className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer outline-none focus:ring-2 focus:ring-accent focus:ring-offset-4 focus:ring-offset-[#0a0a0a]"
                aria-label={`Reproducir videoclip ${work.title} de ${work.artist}`}
              >
                {/* Fallback de imagen usando img estándar (muy seguro para URLs cruzadas de YouTube) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={work.thumbnail}
                  alt={work.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.8] group-hover:brightness-95"
                  onError={(e) => {
                    // Fallback a hqdefault si maxresdefault no carga
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("hqdefault.jpg")) {
                      const videoId = work.youtubeUrl.split("v=")[1]?.split("&")[0];
                      if (videoId) {
                        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }
                    }
                  }}
                />

                {/* Badge superior derecho */}
                <span className="absolute top-4 right-4 z-20 rounded-full border border-accent/20 bg-black/40 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-widest text-accent">
                  Videoclip
                </span>

                {/* Overlay gradiente premium */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20 group-hover:via-black/40 transition-all duration-300 z-10"></div>

                {/* Botón central de Play */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-2xl backdrop-blur-md scale-95 group-hover:scale-110 group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                    <Play className="w-6 h-6 fill-current translate-x-[2px]" />
                  </div>
                </div>

                {/* Títulos en la parte inferior */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white group-hover:text-accent transition-colors duration-300 line-clamp-1">
                    {work.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {work.artist}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Modal / Lightbox de Vídeo */}
      {activeVideo && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 transition-opacity duration-300 ease-out ${
            animate ? "opacity-100" : "opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`Reproductor del videoclip ${activeVideo.title}`}
          onClick={handleClose}
        >
          {/* Contenedor del Modal */}
          <div 
            className={`relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl transition-all duration-300 ease-out ${
              animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera superior cinematográfica */}
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1 rounded-full">
                  {activeVideo.artist} / VIDEOCLIP OFICIAL
                </span>
                <h3 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight text-white mt-2 leading-tight">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer select-none outline-none focus:ring-2 focus:ring-accent"
                aria-label="Cerrar reproductor"
              >
                <span>CERRAR</span>
                <X className="w-4 h-4 text-accent" />
              </button>
            </div>

            {/* Contenedor del Iframe de YouTube */}
            <div className="relative aspect-video w-full rounded-2xl border border-accent/20 bg-black overflow-hidden shadow-2xl shadow-accent/10">
              <iframe
                src={`${activeVideo.embedUrl}?autoplay=1`}
                title={activeVideo.title}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            {/* Pie de página del modal */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                {activeVideo.description || "Videoclip oficial producido por Garage Visuals."}
              </p>
              
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-650 hover:bg-red-650 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/25 outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
              >
                Ver en YouTube <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
