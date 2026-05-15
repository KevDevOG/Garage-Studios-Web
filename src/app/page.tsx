import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import GalleryCard from "@/components/GalleryCard";
import ScrollReveal from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/app/actions/services";

// Importación dinámica de componentes pesados que están "below the fold"
const SpotifyProductions = dynamic(() => import("@/components/SpotifyProductions"), { ssr: true });
const FAQ = dynamic(() => import("@/components/FAQ"), { ssr: true });
const ContactForm = dynamic(() => import("@/components/ContactForm"), { ssr: true });

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

  // Seleccionamos servicios destacados para la Home
  // Intentamos mostrar una mezcla representativa o simplemente los primeros activos
  const featuredIds = [
    "1 canción + producción",
    "2 canciones + producción",
    "Licencia básica",
    "Pack grabación + edición de videoclip 1h"
  ];

  let selectedServices = dbServices.filter(s => featuredIds.includes(s.nombre));
  
  // Si por algún motivo no hay coincidencias por nombre, tomamos los 4 primeros
  if (selectedServices.length === 0) {
    selectedServices = dbServices.slice(0, 4);
  }

  const featuredServices = selectedServices.map((s) => ({
    id: s.id,
    name: s.nombre,
    description: s.descripcion,
    price: s.precio + " €",
    duration: s.duracion_minutos ? s.duracion_minutos + " min" : undefined,
    icon: s.icono,
  }));

  return (
    <>
      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <Hero />

      {/* ── 2. Servicios Destacados ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Nuestros <span className="text-accent">Planes</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          <p className="mt-6 text-lg font-medium text-muted">
            Todo lo que necesitas para llevar tu música al siguiente nivel.
          </p>
        </ScrollReveal>
        <div className={`grid gap-8 sm:grid-cols-2 ${featuredServices.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {featuredServices.map((service, index) => (
            <ScrollReveal key={service.id} delay={index * 0.1}>
              <ServiceCard service={service} featured={true} />
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal className="mt-12 text-center" delay={0.3}>
          <Link
            href="/servicios"
            className="inline-block rounded-full border border-accent/30 bg-accent/5 px-8 py-3 text-sm font-black uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-black"
          >
            Ver todos los servicios →
          </Link>
        </ScrollReveal>
      </section>

      {/* ── 3. El Estudio (Por qué elegirnos) ─────────────────── */}
      <section className="border-t border-card-border bg-gradient-to-b from-card-bg/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <ScrollReveal className="mb-16 text-center">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">¿Por qué <span className="text-accent">Garage Studios</span>?</h2>
            <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
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
          <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted">Equipamiento profesional de alto nivel</p>
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
              Un vistazo al ambiente donde el talento se transforma en sonido.
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
              Ver galería completa →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. Garage Visuals (Teaser) ───────────────────────── */}
      <section className="relative border-t border-card-border overflow-hidden">
        <div className="absolute inset-0 bg-accent/5 z-0"></div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 px-4 py-24 sm:px-6 md:flex-row relative z-10">
          <ScrollReveal className="max-w-2xl text-center md:text-left" direction="right">
            <div className="mb-6 inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-accent">
              Audiovisual Division
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">Garage <span className="text-accent">Visuals</span></h2>
            <p className="mt-6 text-lg font-medium leading-relaxed text-gray-300">
              Elevamos tu imagen al mismo nivel que tu sonido. Videoclips en 4K nativo, sesiones fotográficas de alta gama y contenido estratégico para redes sociales.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
              <Link
                href="/visuals"
                className="rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-accent hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
              >
                Ver Portafolio Visual
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal className="grid grid-cols-2 gap-4 text-accent/20 select-none pointer-events-none" direction="left" delay={0.2}>
            <span className="text-8xl">🎥</span>
            <span className="text-8xl mt-8">📸</span>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. Spotify Productions ──────────────────────────── */}
      <ScrollReveal>
        <SpotifyProductions />
      </ScrollReveal>

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
                  ¿Listo para grabar? Escríbenos y te responderemos en <span className="font-semibold text-white">menos de 24 horas</span> con un presupuesto adaptado a tu proyecto.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">📍</div>
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
                          Cómo llegar <span aria-hidden="true">→</span>
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">🕒</div>
                  <div>
                    <h3 className="font-semibold text-white">Horarios</h3>
                    <p className="mt-1 text-sm text-muted">L-V: 16:00 - 22:00<br />Sáb: 10:00 - 00:00<br />Dom: 15:00 - 22:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-xl text-accent">✉️</div>
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
    </>
  );
}
