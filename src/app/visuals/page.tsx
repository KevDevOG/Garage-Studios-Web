import type { Metadata } from "next";
import Link from "next/link";
import { getActiveServices } from "@/app/actions/services";
import { Clapperboard, Camera, ChevronRight } from "lucide-react";
import BrandTransition from "@/components/BrandTransition";
import { getVisualsImages } from "@/app/actions/visuals";
import VisualsGallery from "@/components/visuals/VisualsGallery";
import VideoShowcase from "@/components/visuals/VideoShowcase";
import CinematicSectionBackground from "@/components/visuals/CinematicSectionBackground";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Garage Visuals",
  description: "Contenido visual para artistas, marcas y creadores. Fotografía, videoclips y piezas audiovisuales.",
};

export const dynamic = "force-dynamic";

interface ServiceDisplay {
  id: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  icon: string;
  gifUrl: string;
}

// Mapeo dinámico y robusto para asignar los GIFs locales animados
function getVisualServiceIcon(name: string): string {
  const n = name.toLowerCase();
  
  // 1. Edición de fotografía
  if ((n.includes("edición") || n.includes("edicion")) && (n.includes("foto") || n.includes("fotografía") || n.includes("fotografia"))) {
    return "/icons/services/edicion-de-fotografias.gif";
  }
  
  // 2. Pack grabación + edición de videoclip
  if (n.includes("pack") && n.includes("videoclip")) {
    return "/icons/services/edicion-de-video.gif";
  }
  
  // 3. Grabación de videoclip
  if (n.includes("videoclip") && (n.includes("grabación") || n.includes("grabacion") || n.includes("rodaje") || n.includes("grabacion de"))) {
    return "/icons/services/frente-de-camara.gif";
  }
  
  // 4. Sesión de fotos
  if (n.includes("foto") || n.includes("fotografía") || n.includes("fotografia")) {
    return "/icons/services/frente-de-camara.gif";
  }
  
  // Fallback si no coincide
  return "/icons/services/mas.gif";
}

function VisualsServiceCard({ service }: { service: ServiceDisplay }) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-gray-250/60 bg-white p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-accent/30">
      <div>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-gray-200/80 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
          <img
            src={service.gifUrl}
            alt={`Icono de ${service.name}`}
            className="h-16 w-16 object-contain"
          />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-gray-950">{service.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 font-medium">{service.description}</p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100/80">
        <div className="flex items-center justify-between text-sm mb-6">
          <span className="text-2xl font-black text-gray-950">{service.price}</span>
          {service.duration && (
            <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              {service.duration}
            </span>
          )}
        </div>
        <Link
          href={`/reservas?servicio=${service.id}`}
          className="block w-full rounded-xl bg-gray-950 px-4 py-3.5 text-center text-xs font-black text-white transition-all hover:bg-gray-800 hover:shadow-lg uppercase tracking-widest outline-none focus:ring-2 focus:ring-accent"
        >
          RESERVAR
        </Link>
      </div>
    </div>
  );
}

export default async function VisualsPage() {
  const dbServices = await getActiveServices();
  const imagenes = await getVisualsImages();

  // Mapear servicios de base de datos
  const mappedServices = dbServices.map(s => ({
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    price: s.precio + " €",
    duration: s.duracion_minutos ? s.duracion_minutos + " min" : undefined,
    icon: s.icono,
    category: s.categoria,
    subcategory: s.subcategoria,
    orden: s.orden,
    gifUrl: getVisualServiceIcon(s.nombre),
  }));

  // Filtros de coincidencia robustos
  const isPhotos1h = (name: string) => {
    const n = name.toLowerCase();
    return (n.includes("sesión de fotos") || n.includes("sesion de fotos") || n.includes("sesion fotos") || n.includes("sesión fotos")) && 
           (n.includes("1 hora") || n.includes("1h") || (!n.includes("2 hora") && !n.includes("2h") && !n.includes("3 hora") && !n.includes("3h")));
  };

  const isGrabacionVideoclip = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("videoclip") && 
           (n.includes("grabación") || n.includes("grabacion") || n.includes("rodaje") || n.includes("grabacion de")) && 
           !n.includes("pack") && 
           !n.includes("edición") && 
           !n.includes("edicion");
  };

  const isPackVideoclip = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("pack") && n.includes("videoclip");
  };

  const isEdicionFoto = (name: string) => {
    const n = name.toLowerCase();
    return (n.includes("edición") || n.includes("edicion")) && 
           (n.includes("foto") || n.includes("fotografía") || n.includes("fotografia"));
  };

  // 1. Filtrar los 3 servicios principales en el orden exacto solicitado
  const mainVisualServices: typeof mappedServices = [];

  const photosService = mappedServices.find(s => isPhotos1h(s.name));
  if (photosService) mainVisualServices.push(photosService);

  const grabacionService = mappedServices.find(s => isGrabacionVideoclip(s.name));
  if (grabacionService) mainVisualServices.push(grabacionService);

  const packService = mappedServices.find(s => isPackVideoclip(s.name));
  if (packService) mainVisualServices.push(packService);

  // 2. Filtrar extra informativo de edición de fotografía
  const extraVisualService = mappedServices.find(s => isEdicionFoto(s.name));

  return (
    BrandTransition ? (
      <BrandTransition>
        <main className="min-h-screen bg-[#FAFAFA] text-[#111111]">
          
          {/* ── 1. HERO VISUALS ───────────────────────────────────────── */}
          <section className="relative overflow-hidden pt-24 pb-24 sm:pt-32 sm:pb-32 border-b border-gray-200/80">
            <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#111 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10 text-center">
              <ScrollReveal delay={0.1} distance={20}>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent shadow-sm">
                  <Camera className="w-3 h-3" /> Audiovisual Division
                </span>
              </ScrollReveal>
              <ScrollReveal delay={0.2} distance={30}>
                <h1 className="text-5xl font-black tracking-tighter sm:text-6xl lg:text-8xl text-gray-950 uppercase italic drop-shadow-sm leading-none">
                  GARAGE <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">VISUALS</span>
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.3} distance={20}>
                <p className="mt-8 text-lg sm:text-xl font-bold leading-relaxed text-gray-700 max-w-3xl mx-auto uppercase tracking-wide">
                  Contenido visual para artistas, marcas y creadores.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.4} distance={20}>
                <p className="mt-4 text-base sm:text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                  Fotografía, videoclips y piezas audiovisuales con una estética cuidada para destacar tu proyecto.
                </p>
              </ScrollReveal>
              
              <ScrollReveal delay={0.5} distance={20}>
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="#trabajos"
                    className="w-full sm:w-auto text-center rounded-full bg-gray-950 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-gray-800 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.15)]"
                  >
                    Ver trabajos
                  </a>
                  <Link
                    href="/reservas"
                    className="w-full sm:w-auto text-center rounded-full border-2 border-gray-950/10 bg-gray-950/5 px-10 py-5 text-sm font-black uppercase tracking-widest text-gray-950 transition-all hover:border-gray-950/20 hover:bg-gray-950/10 hover:scale-105"
                  >
                    Reservar proyecto
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* ── 2. VIDEOCLIPS / TRABAJOS YOUTUBE (PORTFOLIO INTERACTIVO) ── */}
          <VideoShowcase />

          {/* ── 3. GALERÍA VISUAL (COMPONENTE INTEGRADO DE ALTO NIVEL) ── */}
          <section className="relative overflow-hidden bg-[#FAFAFA] py-16 border-y border-gray-250/60">
            <CinematicSectionBackground variant="gallery" />
            <div className="relative z-10">
              <VisualsGallery imagenes={imagenes} />
            </div>
          </section>

          {/* ── 4. SERVICIOS VISUALES ───────────────────────────────── */}
          <section className="relative overflow-hidden bg-[#FAFAFA] border-b border-gray-250/60 w-full">
            <CinematicSectionBackground variant="services" />
            <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6">
              <ScrollReveal>
                <div className="mb-16 text-center">
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-accent">
                    Nuestros servicios
                  </span>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl text-gray-950 mt-2">
                    Servicios <span className="text-accent">visuales</span>
                  </h2>
                  <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
                  <p className="mt-6 text-lg font-medium text-gray-500 max-w-2xl mx-auto">
                    Una cuidada selección de nuestros servicios principales.
                  </p>
                </div>
              </ScrollReveal>
            
            {mainVisualServices.length === 0 ? (
              <div className="rounded-3xl border border-gray-250/60 bg-white p-12 text-center shadow-sm max-w-2xl mx-auto">
                <Clapperboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Catálogo visual en preparación.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {/* Grid de las 3 cards principales */}
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {mainVisualServices.map((service, index) => (
                    <ScrollReveal key={service.id} delay={index * 0.1} distance={30}>
                      <VisualsServiceCard service={service} />
                    </ScrollReveal>
                  ))}
                </div>

                {/* Bloque informativo secundario de Edición de fotografía */}
                {extraVisualService && (
                  <ScrollReveal delay={0.4}>
                    <div className="max-w-2xl mx-auto mt-12">
                      <div className="rounded-2xl border border-gray-250/60 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-accent/30 hover:shadow-md">
                        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white border border-gray-200/80 shadow-sm overflow-hidden">
                            <img
                              src={extraVisualService.gifUrl}
                              alt={`Icono de ${extraVisualService.name}`}
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Extra disponible</h4>
                            <p className="text-sm font-black uppercase tracking-tight text-gray-950">{extraVisualService.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {extraVisualService.description || "Añade edición y procesado digital profesional a tus tomas fotográficas."}
                            </p>
                          </div>
                        </div>
                        <div className="text-center sm:text-right shrink-0 mt-2 sm:mt-0">
                          <p className="text-lg font-black text-gray-950">{extraVisualService.price}</p>
                          {extraVisualService.duration && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                              {extraVisualService.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                {/* Botón Ver más servicios */}
                <ScrollReveal delay={0.5}>
                  <div className="text-center pt-4">
                    <Link
                      href="/servicios"
                      className="inline-flex items-center justify-center rounded-full border border-gray-950/10 bg-gray-950/5 px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-950 transition-all hover:bg-gray-950/10 hover:border-gray-950/20 hover:scale-105"
                    >
                      Ver más servicios <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            )}
            </div>
          </section>

          {/* ── 5. CTA FINAL ────────────────────────────────────────── */}
          <section className="bg-gray-900 py-32 text-center text-white px-4 border-t border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            <div className="mx-auto max-w-3xl relative z-10">
              <ScrollReveal>
                <h2 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter text-white mb-6">
                  Lleva tu imagen al <span className="text-accent">siguiente nivel</span>.
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="text-lg text-gray-400 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">
                  Cuéntanos qué necesitas y preparamos una propuesta visual adaptada a tu proyecto.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.2} distance={20}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link
                    href="/reservas"
                    className="w-full sm:w-auto rounded-full bg-accent px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  >
                    Reservar proyecto
                  </Link>
                  <Link
                    href="/contacto"
                    className="w-full sm:w-auto rounded-full border-2 border-white/20 bg-white/5 px-10 py-5 text-sm font-black uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 hover:scale-105"
                  >
                    Contactar
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>

        </main>
      </BrandTransition>
    ) : null
  );
}
