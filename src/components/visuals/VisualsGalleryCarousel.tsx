"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisualImage } from "@/app/actions/visuals";

interface VisualsGalleryCarouselProps {
  title: string;
  description: string;
  images: VisualImage[];
  autoScrollInterval: number;
  onImageClick: (index: number) => void;
  isLightboxOpen: boolean;
  icon: React.ReactNode;
}

export default function VisualsGalleryCarousel({
  title,
  description,
  images,
  autoScrollInterval,
  onImageClick,
  isLightboxOpen,
  icon,
}: VisualsGalleryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 1. Detectar prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // 2. Detectar visibilidad de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 3. Helper para hacer scroll a un índice específico
  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container || container.children.length === 0) return;

    const targetCard = container.children[index] as HTMLElement;
    if (targetCard) {
      container.scrollTo({
        left: targetCard.offsetLeft - (container.clientWidth - targetCard.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  };

  // 4. Temporizador de auto-scroll
  useEffect(() => {
    if (images.length <= 1) return;
    // Detener auto-scroll si se cumple alguna condición de pausa
    if (isLightboxOpen || isHovered || isInteracting || !isPageVisible || reducedMotion) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % images.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [images.length, isLightboxOpen, isHovered, isInteracting, isPageVisible, reducedMotion, autoScrollInterval]);

  // 5. Manejar clicks en botones manuales con pausa temporal inteligente (8 segundos)
  const handleManualScroll = (direction: "left" | "right") => {
    if (images.length === 0) return;

    // Activar pausa temporal de interacción
    setIsInteracting(true);
    const resumeTimeout = setTimeout(() => {
      setIsInteracting(false);
    }, 8000); // Pausar auto-scroll por 8 segundos tras interactuar manualmente

    let nextIndex = activeIndex;
    if (direction === "left") {
      nextIndex = (activeIndex - 1 + images.length) % images.length;
    } else {
      nextIndex = (activeIndex + 1) % images.length;
    }

    setActiveIndex(nextIndex);
    scrollToIndex(nextIndex);

    return () => clearTimeout(resumeTimeout);
  };

  // 6. Sincronizar el índice activo al deslizar con el dedo (móvil)
  const handleScrollListener = () => {
    const container = containerRef.current;
    if (!container || images.length === 0) return;

    const scrollLeft = container.scrollLeft;
    const firstCard = container.firstElementChild as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 24; // gap-6 de Tailwind es 24px
    const index = Math.round(scrollLeft / (cardWidth + gap));

    if (index >= 0 && index < images.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="mb-20">
      {/* Cabecera de la categoría */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-xl">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent mb-2">
            {icon} {title}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase italic text-gray-950 tracking-tighter">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">{description}</p>
        </div>

        {/* Botones de navegación manual en desktop */}
        {images.length > 0 && (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => handleManualScroll("left")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-95"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-accent" />
            </button>
            <button
              onClick={() => handleManualScroll("right")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-95"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 text-accent" />
            </button>
          </div>
        )}
      </div>

      {/* Contenido del Carrusel */}
      {images.length === 0 ? (
        /* Tarjeta elegante de Placeholder */
        <div className="flex items-center justify-center border-2 border-dashed border-gray-250/60 rounded-3xl bg-white p-12 text-center w-full min-h-[250px] shadow-sm">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/5 border border-accent/15 text-accent">
              {icon}
            </div>
            <h4 className="text-base font-black uppercase text-gray-800 tracking-tight">Próximamente {title.toLowerCase()}</h4>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
              Estamos catalogando el mejor material visual. ¡Muy pronto disponible!
            </p>
          </div>
        </div>
      ) : (
        /* Contenedor horizontal con scroll-snap y pausas por ratón */
        <div
          className="relative group/carrusel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Sombras suaves laterales en desktop */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FAFAFA] to-transparent pointer-events-none z-10 hidden md:block"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAFAFA] to-transparent pointer-events-none z-10 hidden md:block"></div>

          <div
            ref={containerRef}
            onScroll={handleScrollListener}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {images.map((item, index) => (
              <div
                key={item.id}
                onClick={() => onImageClick(index)}
                className={`group relative aspect-[3/4] w-[260px] sm:w-[320px] shrink-0 snap-center overflow-hidden rounded-2xl bg-white border shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ${
                  index === activeIndex
                    ? "border-accent ring-1 ring-accent/20"
                    : "border-gray-250/60"
                }`}
              >
                <img
                  src={item.url_imagen}
                  alt={item.titulo || "Imagen de Garage Visuals"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradiente sutil inferior con hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 select-none">
                  <span className="text-[10px] tracking-widest font-black uppercase text-accent mb-1.5">
                    {item.tipo.replace(/_/g, " ")}
                  </span>
                  {item.titulo?.trim() && (
                    <h4 className="text-base sm:text-lg font-black uppercase italic text-white leading-tight tracking-tight">
                      {item.titulo}
                    </h4>
                  )}
                  {item.descripcion?.trim() && (
                    <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores en forma de puntos (opcional, muy premium) */}
          {images.length > 1 && (
            <div className="mt-4 flex justify-center gap-1.5 md:hidden">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    scrollToIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-4 bg-accent" : "w-1.5 bg-gray-300"
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
