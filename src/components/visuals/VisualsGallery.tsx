"use client";

import { useState, useEffect } from "react";
import { Camera, ChevronLeft, ChevronRight, X, Film, Library } from "lucide-react";
import { VisualImage } from "@/app/actions/visuals";
import VisualsGalleryCarousel from "./VisualsGalleryCarousel";
import ScrollReveal from "@/components/ScrollReveal";

interface VisualsGalleryProps {
  imagenes: VisualImage[];
}

export default function VisualsGallery({ imagenes }: VisualsGalleryProps) {
  // 1. Agrupar imágenes en base al tipo de visuals_imagen
  // - Sesiones de fotos: tipo = 'fotos'
  // - Sesiones de grabación: tipo = 'grabaciones'
  // - Rodajes: tipo = 'rodajes'
  const fotos = imagenes.filter(img => img.tipo === "fotos");
  const grabaciones = imagenes.filter(img => img.tipo === "grabaciones");
  const rodajes = imagenes.filter(img => img.tipo === "rodajes");

  // Estados para Lightbox
  const [activeCategory, setActiveCategory] = useState<"fotos" | "grabaciones" | "rodajes" | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Funciones de navegación del Lightbox
  const getActiveList = () => {
    if (activeCategory === "fotos") return fotos;
    if (activeCategory === "grabaciones") return grabaciones;
    if (activeCategory === "rodajes") return rodajes;
    return [];
  };

  const openLightbox = (category: "fotos" | "grabaciones" | "rodajes", index: number) => {
    setActiveCategory(category);
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveCategory(null);
    setActiveImageIndex(null);
  };

  const handleNext = () => {
    const list = getActiveList();
    if (list.length === 0 || activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex + 1) % list.length);
  };

  const handlePrev = () => {
    const list = getActiveList();
    if (list.length === 0 || activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex - 1 + list.length) % list.length);
  };

  // Escuchar eventos de teclado (Escape, Flechas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, activeCategory]);

  const activeList = getActiveList();
  const activeImage = activeImageIndex !== null ? activeList[activeImageIndex] : null;

  return (
    <>
      {/* 1. Categorías del Portfolio Visual */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <ScrollReveal>
          <div className="mb-20 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent shadow-sm">
              <Library className="w-3.5 h-3.5" /> Portafolio de Trabajos
            </span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter text-gray-950 mt-2">
              Galería <span className="text-accent">Visual</span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mt-6 text-base sm:text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Sesiones, grabaciones y rodajes creados para artistas, marcas y proyectos.
            </p>
          </div>
        </ScrollReveal>

        {/* Renderizado de Categorías mediante Carrusel */}
        <ScrollReveal delay={0.1}>
          <VisualsGalleryCarousel
            title="Sesiones de fotos"
            description="Retratos, books y contenido visual editorial para artistas y marcas."
            images={fotos}
            autoScrollInterval={2500}
            onImageClick={(index) => openLightbox("fotos", index)}
            isLightboxOpen={activeCategory !== null}
            icon={<Camera className="w-4 h-4 text-accent" />}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <VisualsGalleryCarousel
            title="Sesiones de grabación"
            description="Momentos reales dentro del estudio, procesos creativos y el detrás de cámaras más exclusivo."
            images={grabaciones}
            autoScrollInterval={3000}
            onImageClick={(index) => openLightbox("grabaciones", index)}
            isLightboxOpen={activeCategory !== null}
            icon={<Library className="w-4 h-4 text-accent" />}
          />
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <VisualsGalleryCarousel
            title="Rodajes"
            description="Videoclips musicales, piezas promocionales y producciones de video cinematográficas."
            images={rodajes}
            autoScrollInterval={3500}
            onImageClick={(index) => openLightbox("rodajes", index)}
            isLightboxOpen={activeCategory !== null}
            icon={<Film className="w-4 h-4 text-accent" />}
          />
        </ScrollReveal>
      </section>

      {/* 2. Lightbox / Modal de Imagen Ampliada */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 select-none transition-all duration-300"
          onClick={closeLightbox}
        >
          {/* Botón de cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-md"
            aria-label="Cerrar galería"
          >
            <X className="w-6 h-6 text-accent" />
          </button>

          {/* Navegación anterior (oculto si solo hay 1 imagen) */}
          {activeList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-md"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-6 h-6 text-accent" />
            </button>
          )}

          {/* Navegación siguiente (oculto si solo hay 1 imagen) */}
          {activeList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-md"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-6 h-6 text-accent" />
            </button>
          )}

          {/* Contenedor central de la imagen con la descripción */}
          <div
            className="relative flex flex-col items-center justify-center max-w-5xl w-full h-full max-h-[85vh] transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen ampliada */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-black/20 w-full">
              <img
                src={activeImage.url_imagen}
                alt={activeImage.titulo || "Imagen de Garage Visuals"}
                className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl animate-fade-in"
              />
            </div>

            {/* Ficha editorial / Datos de la imagen al pie */}
            <div className="w-full text-center mt-6 px-4 max-w-3xl">
              <span className="text-[10px] tracking-widest font-black uppercase text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
                {activeImage.tipo.replace(/_/g, " ")}
              </span>
              {activeImage.titulo?.trim() && (
                <h3 className="text-xl sm:text-2xl font-black uppercase italic text-white tracking-tight mt-3 leading-tight">
                  {activeImage.titulo}
                </h3>
              )}
              {activeImage.descripcion?.trim() && (
                <p className="text-sm text-gray-300 mt-2 font-medium leading-relaxed max-w-2xl mx-auto">
                  {activeImage.descripcion}
                </p>
              )}
              {activeList.length > 1 && (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-4">
                  Imagen {(activeImageIndex ?? 0) + 1} de {activeList.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
