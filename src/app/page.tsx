import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import PlansLightningBackground from "@/components/PlansLightningBackground";
import ServiceCard from "@/components/ServiceCard";
import GalleryCard from "@/components/GalleryCard";
import ScrollReveal from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/app/actions/services";
import IntroLoader from "@/components/IntroLoader";

// Importación dinámica de componentes pesados que están "below the fold"
const SpotifyShowcase = dynamic(() => import("@/components/SpotifyShowcase"), { ssr: true });
const FAQ = dynamic(() => import("@/components/FAQ"), { ssr: true });
const ContactForm = dynamic(() => import("@/components/ContactForm"), { ssr: true });
import { MapPin, Clock, Mail, Video, Camera, ChevronRight } from "lucide-react";

// Revalidar la página cada hora (Incremental Static Regeneration)
export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();

  // Ejecutamos ambas consultas en paralelo para mejorar el tiempo de respuesta del servidor
  const [dbServices, { data: previewGallery }] = await Promise.all([
    getActiveServices(),
    supabase
      .from("imagen")
      .select("id, titulo, descripcion, url_imagen")
      .order("created_at", { ascending: false })
      .limit(4)
  ]);

  // Filtramos explícitamente los 3 planes principales y la hora extra
  const planNames = [
    "1 canción + producción",
    "2 canciones + producción",
    "3 canciones + producción"
  ];
  
  const mainPlansRaw = dbServices.filter(s => planNames.includes(s.nombre));
  // Ordenar para garantizar 1, 2, 3
  const mainPlans = mainPlansRaw.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const extraHour = dbServices.find(s => s.nombre === "Hora extra en pack canción + producción");

  const planStyles: Record<string, { border: string, shadow: string, iconBg: string, iconText: string, button: string, ring: string }> = {
    "1 canción + producción": {
      border: "border-[#CD7F32]/50 hover:border-[#CD7F32]",
      shadow: "shadow-[0_0_25px_rgba(205,127,50,0.15)] hover:shadow-[0_0_40px_rgba(205,127,50,0.4)]",
      iconBg: "bg-[#CD7F32]/10",
      iconText: "text-[#CD7F32]",
      button: "bg-[#CD7F32] hover:bg-[#b06a26] hover:shadow-[0_0_20px_rgba(205,127,50,0.4)]",
      ring: "ring-1 ring-[#CD7F32]/30"
    },
    "2 canciones + producción": {
      border: "border-[#C0C0C0]/50 hover:border-[#C0C0C0]",
      shadow: "shadow-[0_0_25px_rgba(192,192,192,0.15)] hover:shadow-[0_0_40px_rgba(192,192,192,0.4)]",
      iconBg: "bg-[#C0C0C0]/10",
      iconText: "text-[#C0C0C0]",
      button: "bg-[#C0C0C0] text-black hover:bg-[#a0a0a0] hover:shadow-[0_0_20px_rgba(192,192,192,0.4)]",
      ring: "ring-1 ring-[#C0C0C0]/30"
    },
    "3 canciones + producción": {
      border: "border-[#F59E0B]/50 hover:border-[#F59E0B]",
      shadow: "shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]",
      iconBg: "bg-[#F59E0B]/10",
      iconText: "text-[#F59E0B]",
      button: "bg-[#F59E0B] text-black hover:bg-[#d97706] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
      ring: "ring-1 ring-[#F59E0B]/30"
    }
  };

  return (
    <>
      <IntroLoader />
      <main className="relative min-h-screen bg-black">
        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-4 pb-20 text-center sm:pt-6 sm:pb-32">
          {/* Imagen de fondo */}
          <div className="absolute inset-0 z-[-2]">
            <Image
              src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941347466-cf14b757-064e-4743-83b4-ce1b9763b829.jpg"
              alt="Garage Studios - Estudio de Grabación en Las Palmas"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-50"
            />
          </div>

          {/* Overlay oscuro para garantizar legibilidad del texto siempre */}
          <div className="absolute inset-0 z-[-1] bg-black/40"></div>
          {/* Overlay de degradado para fusionar suavemente con el fondo de la página */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent via-transparent to-background"></div>

          {/* Contenido (con animaciones de entrada) */}
          <div className="relative z-10 max-w-4xl animate-slide-up opacity-0">
            {/* Logo Real */}
            <div className="mb-4 flex justify-center">
              <Image
                src="/images/logo-sin-fondo.png"
                alt="Garage Studios Logo"
                width={1000}
                height={400}
                className="h-auto w-full max-w-[240px] object-contain sm:max-w-[380px] md:max-w-[500px]"
                priority
              />
            </div>

            {/* Ubicación */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-widest text-accent uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
              </span>
              Las Palmas de Gran Canaria
            </div>

            {/* Título */}
            <h1 className="text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl drop-shadow-2xl uppercase italic">
              Estudio de grabación en <span className="text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">Las Palmas de Gran Canaria</span>
            </h1>

            {/* Descripción */}
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-200 sm:text-xl drop-shadow">
              Para artistas que buscan un estudio musical con sonido profesional, producción musical completa y videoclips de la mejor calidad.
            </p>

            {/* Botones CTA */}
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link
                href="/reservas"
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-10 py-5 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              >
                <span>RESERVAR AHORA</span>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/servicios"
                className="rounded-full border-2 border-white/20 bg-white/5 px-10 py-5 text-lg font-bold text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
              >
                VER SERVICIOS
              </Link>
            </div>
          </div>
        </section>

      {/* ── Secciones Centrales ──────────────────────────────── */}

      {/* ── 2. Servicios Destacados ──────────────────────────── */}
      <section className="relative overflow-hidden bg-black border-t border-white/5 w-full">
        <PlansLightningBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Nuestros <span className="text-accent">Planes</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          <p className="mt-6 text-lg font-medium text-muted">
            Tu estudio musical en Las Palmas. Todo lo que necesitas para llevar tu producción musical al siguiente nivel.
          </p>
        </ScrollReveal>

        {/* Grid de 3 columnas para los planes principales */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {mainPlans.map((s, index) => {
            const style = planStyles[s.nombre] || planStyles["1 canción + producción"]; // fallback just in case
            return (
              <ScrollReveal key={s.id} delay={index * 0.1}>
                <div className={`group flex flex-col h-full justify-between rounded-xl border bg-card-bg p-6 transition-all duration-300 hover:-translate-y-1 ${style.border} ${style.shadow} ${style.ring}`}>
                  <div className="flex flex-col flex-1">
                    <div className={`mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 border-white/5 ${style.iconBg} ${style.iconText}`}>
                      {s.icono_url ? (
                        <img 
                          src={s.icono_url} 
                          alt={s.nombre} 
                          loading="lazy"
                          className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        />
                      ) : (
                        <span className="text-5xl filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{s.icono}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white min-h-[56px] flex items-center">{s.nombre}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400 font-medium min-h-[80px]">{s.descripcion}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-card-border/50 flex flex-col justify-end mt-auto">
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-2xl font-black text-white">{s.precio} €</span>
                      {s.duracion_minutos && <span className="text-xs font-bold uppercase tracking-widest text-muted">{s.duracion_minutos} min</span>}
                    </div>
                    <Link
                      href={`/reservas?servicio=${s.id}`}
                      className={`block rounded-lg px-4 py-3 text-center text-sm font-black text-black transition-all uppercase tracking-widest ${style.button}`}
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bloque informativo secundario de Hora Extra */}
        {extraHour && (
          <ScrollReveal delay={0.4} className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors hover:bg-white/[0.04]">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-2xl filter drop-shadow-md border border-white/5">
                  {extraHour.icono_url ? (
                    <img src={extraHour.icono_url} alt={extraHour.nombre} className="w-6 h-6 object-contain" />
                  ) : (
                    <span>{extraHour.icono}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Extra disponible</h4>
                  <p className="text-sm font-bold text-white">{extraHour.nombre}</p>
                  <p className="text-xs text-muted mt-0.5">{extraHour.descripcion || "Añade tiempo adicional a tu pack de grabación y producción."}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black text-white">{extraHour.precio} €</p>
                {extraHour.duracion_minutos && <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{extraHour.duracion_minutos} min</p>}
              </div>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-16 text-center" delay={0.5}>
          <Link
            href="/servicios"
            className="inline-flex items-center justify-center rounded-full border border-accent/30 bg-accent/5 px-8 py-3 text-sm font-black uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            Ver todos los servicios <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </ScrollReveal>
        </div>
      </section>

      {/* ── Spotify Showcase ─────────────────────────────────── */}
      <ScrollReveal>
        <SpotifyShowcase />
      </ScrollReveal>

      {/* ── 3. El Estudio (Por qué elegirnos) ─────────────────── */}
      <section className="border-t border-card-border bg-gradient-to-b from-card-bg/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <ScrollReveal className="mb-16 text-center">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">¿Por qué <span className="text-accent">Garage Studios</span>?</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mt-6 text-lg font-medium text-muted">
              El estudio de grabación de referencia en Las Palmas de Gran Canaria, con un ambiente óptimo y cercano para artistas.
            </p>
          </ScrollReveal>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941483912-4e6d5084-4718-4368-8248-7bbb31bc67f8.jpg",
                alt: "Producción musical",
                title: "Producción musical",
                desc: "Aislamiento acústico de primer nivel y equipos de alta gama para un sonido profesional."
              },
              {
                src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941461306-fc3e4ee6-597b-4659-abc6-ed46e41a80fd.jpg",
                alt: "Zona creativa",
                title: "Zona creativa",
                desc: "Ambiente cercano, relajado e inspirador para conectar con tu visión artística."
              },
              {
                src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941377774-bcb5e4fc-9b6e-4f76-b51c-5ea8a8e07ae2.jpg",
                alt: "Grabación",
                title: "Grabación",
                desc: "Resultados increíbles adaptados a las necesidades de músicos y bandas locales."
              }
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.15} direction="up">
                <div className="relative overflow-hidden flex flex-col items-center justify-end text-center rounded-2xl border border-card-border bg-card-bg transition-all hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(0,0,0,0.8)] group min-h-[300px] sm:min-h-[400px]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-in-out z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                  <div className="relative z-20 p-8 w-full">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{item.title}</h3>
                    <p className="mt-3 text-sm font-medium text-gray-400">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Gear & Equipamiento ──────────────────────────── */}
      <section className="border-t border-card-border mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">Hardware & <span className="text-accent">Gear</span></h2>
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted">Equipamiento profesional de alto nivel en nuestro estudio musical</p>
        </ScrollReveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Micrófonos", src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941377774-bcb5e4fc-9b6e-4f76-b51c-5ea8a8e07ae2.jpg", list: ["2X RHODE NT2", "RHODE NT1", "SHIELD ACÚSTICO"] },
            { title: "Interface", src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941385359-0d545ba5-c0c6-4a79-bc3b-65a2fc9bfc9c.jpg", list: ["APOLLO SOLO", "FOCUSRITE 2I2", "SPL GOLD MIKE 9845"] },
            { title: "Monitores", src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941428088-81144e31-a481-43b5-b8c6-6d21416d6672.jpg", list: ["M-AUDIO BX5", "2X AKG HEADPHONES", "SAMSUNG 55\" 4K"] },
            { title: "Producción", src: "https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941483912-4e6d5084-4718-4368-8248-7bbb31bc67f8.jpg", list: ["MESA MILLENIUM", "ALESIS 64 KEYBOARD", "FL STUDIO PRO GEAR"] }
          ].map((gear, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className="relative overflow-hidden rounded-2xl border border-card-border bg-card-bg p-8 transition-all hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(0,0,0,0.8)] min-h-[250px] group">
                <Image
                  src={gear.src}
                  alt={gear.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center opacity-20 grayscale group-hover:opacity-40 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-in-out z-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                <div className="relative z-20 h-full flex flex-col justify-end">
                  <h3 className="mb-3 text-2xl font-black text-white uppercase italic tracking-tighter">{gear.title}</h3>
                  <ul className="space-y-1.5 text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                    {gear.list.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── 5. Galería Preview ───────────────────────────────── */}
      <section className="border-t border-card-border">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <ScrollReveal className="mb-16 text-center">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
              Dentro de <span className="text-accent">Garage Studios</span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
            <p className="mt-6 text-lg font-medium text-muted">
              Un vistazo al ambiente de nuestro estudio de grabación en Las Palmas de Gran Canaria.
            </p>
          </ScrollReveal>
          {previewGallery && previewGallery.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {previewGallery.map((item, idx) => (
                <ScrollReveal key={item.id} delay={idx * 0.1}>
                  <GalleryCard item={item} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <p className="text-center text-sm text-muted">
                Pronto subiremos fotos de nuestro estudio.
              </p>
            </ScrollReveal>
          )}
          <ScrollReveal className="mt-12 text-center" delay={0.2}>
            <Link
              href="/galeria"
              className="text-sm font-black uppercase tracking-widest text-accent hover:underline"
            >
              Ver galería completa <ChevronRight className="inline-block w-4 h-4 ml-1" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. FAQ ──────────────────────────────────────────── */}
      <ScrollReveal>
        <FAQ />
      </ScrollReveal>

    {/* ── 9. Contacto Rápido ───────────────────────────────── */}
    <section id="contacto" className="border-t border-card-border bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <ScrollReveal className="space-y-10" direction="right">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">Hablemos de tu <span className="text-accent">sonido</span></h2>
                <div className="mt-4 h-1 w-20 bg-accent"></div>
                <p className="mt-6 text-lg font-medium text-muted">
                  ¿Listo para grabar tu música en Las Palmas? Escríbenos y te responderemos en <span className="font-semibold text-white">menos de 24 horas</span> con un presupuesto de producción musical, mezcla, masterización o videoclips adaptado a ti.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Ubicación</h3>
                    <p className="mt-1 text-muted">C. Drago, 35010<br />Las Palmas de Gran Canaria, Las Palmas</p>

                    <div className="mt-4 overflow-hidden rounded-lg border border-card-border shadow-md">
                      <div className="h-[150px] w-full bg-black/50 relative">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3519.2068559041677!2d-15.45431782387618!3d28.109726607628502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xc40957fdb7a8903%3A0x8f5d83a7d7675671!2sGarage%20Studios!5e0!3m2!1ses!2ses!4v1777767285936!5m2!1ses!2ses"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="absolute inset-0 grayscale opacity-70 transition-all hover:grayscale-0 hover:opacity-100 duration-500"
                        ></iframe>
                      </div>
                      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-card-border bg-card-bg border-t border-card-border">
                        <a
                          href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-accent hover:text-black"
                        >
                          Cómo llegar <ChevronRight className="inline-block w-4 h-4 ml-1" aria-hidden="true" />
                        </a>
                        <a
                          href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-white/5 hover:text-white"
                        >
                          Ver en Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Horarios</h3>
                    <p className="mt-1 text-sm text-muted">L-V: 16:00 - 22:00<br />Sáb: 10:00 - 00:00<br />Dom: 15:00 - 22:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Email directo</h3>
                    <p className="mt-1 text-muted hover:text-white transition-colors"><a href="mailto:garagestudioslp@gmail.com">garagestudioslp@gmail.com</a></p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal className="animate-slide-up" direction="left" delay={0.2}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                Respuesta en menos de 24h
              </div>
              <ContactForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
