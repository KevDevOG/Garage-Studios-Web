import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import GalleryCard from "@/components/GalleryCard";
import ContactForm from "@/components/ContactForm";
import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/app/actions/services";

export default async function HomePage() {
  // Mostrar los Planes GST como servicios destacados en la home para impulsar ventas, directamente desde Supabase
  const dbServices = await getActiveServices();
  const featuredServices = dbServices
    .filter((s) => s.subcategoria === "Planes GST")
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      name: s.nombre,
      description: s.descripcion,
      price: s.precio + " €",
      duration: s.duracion_minutos ? s.duracion_minutos + " min" : undefined,
      icon: s.icono,
    }));

  // Mostrar las últimas 4 imágenes reales de la galería
  const supabase = await createClient();
  const { data: previewGallery } = await supabase
    .from("imagen")
    .select("id, titulo, descripcion, url_imagen")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <Hero />

      {/* ── Por qué elegirnos ─────────────────────────────── */}
      <section className="border-t border-card-border bg-card-bg/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-12 text-center animate-fade-in delay-100">
            <h2 className="text-2xl font-bold sm:text-3xl">¿Por qué elegir Garage Studios?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="relative overflow-hidden flex flex-col items-center justify-end text-center rounded-xl border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] group min-h-[250px] sm:min-h-[300px]">
              <Image
                src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941483912-4e6d5084-4718-4368-8248-7bbb31bc67f8.jpg"
                alt="Producción musical"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center opacity-50 group-hover:scale-110 transition-transform duration-700 ease-in-out z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <div className="relative z-20 p-6 w-full">
                <h3 className="text-xl font-bold text-white drop-shadow-md">Producción musical</h3>
                <p className="mt-2 text-sm text-gray-200 drop-shadow">Aislamiento acústico de primer nivel y equipos de alta gama.</p>
              </div>
            </div>
            <div className="relative overflow-hidden flex flex-col items-center justify-end text-center rounded-xl border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] group min-h-[250px] sm:min-h-[300px]">
              <Image
                src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941461306-fc3e4ee6-597b-4659-abc6-ed46e41a80fd.jpg"
                alt="Zona creativa"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center opacity-50 group-hover:scale-110 transition-transform duration-700 ease-in-out z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <div className="relative z-20 p-6 w-full">
                <h3 className="text-xl font-bold text-white drop-shadow-md">Zona creativa</h3>
                <p className="mt-2 text-sm text-gray-200 drop-shadow">Ambiente cercano y relajado para conectar con tu visión.</p>
              </div>
            </div>
            <div className="relative overflow-hidden flex flex-col items-center justify-end text-center rounded-xl border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] group min-h-[250px] sm:min-h-[300px]">
              <Image
                src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941377774-bcb5e4fc-9b6e-4f76-b51c-5ea8a8e07ae2.jpg"
                alt="Grabación"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center opacity-50 group-hover:scale-110 transition-transform duration-700 ease-in-out z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              <div className="relative z-20 p-6 w-full">
                <h3 className="text-xl font-bold text-white drop-shadow-md">Grabación</h3>
                <p className="mt-2 text-sm text-gray-200 drop-shadow">Resultados increíbles adaptados a músicos y bandas locales.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Servicios Destacados ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Nuestros Servicios</h2>
          <p className="mt-2 text-muted">
            Todo lo que necesitas para llevar tu música al siguiente nivel.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} featured={true} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/servicios"
            className="text-sm font-medium text-accent hover:underline"
          >
            Ver todos los servicios →
          </Link>
        </div>
      </section>

      {/* ── Nuestro Equipo ─────────────────────────────────── */}
      <section className="border-t border-card-border mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center animate-fade-in delay-100">
          <h2 className="text-2xl font-bold sm:text-3xl">Equipo del Estudio</h2>
          <p className="mt-2 text-muted">
            Hardware y software profesional para conseguir el sonido que buscas.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 transition-all hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] animate-slide-up delay-100 min-h-[220px] group">
            <Image
              src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941377774-bcb5e4fc-9b6e-4f76-b51c-5ea8a8e07ae2.jpg"
              alt="Micrófonos"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-in-out z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
            <div className="relative z-20 h-full flex flex-col justify-end">
              <h3 className="mb-2 text-xl font-bold text-white drop-shadow-md">Micrófonos</h3>
              <ul className="space-y-1 text-sm text-gray-200 drop-shadow">
                <li>• 2x Rhode NT2</li>
                <li>• Rhode NT1</li>
                <li>• Absorbente acústico</li>
              </ul>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 transition-all hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] animate-slide-up delay-200 min-h-[220px] group">
            <Image
              src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941385359-0d545ba5-c0c6-4a79-bc3b-65a2fc9bfc9c.jpg"
              alt="Interfaz y Previo"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-in-out z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
            <div className="relative z-20 h-full flex flex-col justify-end">
              <h3 className="mb-2 text-xl font-bold text-white drop-shadow-md">Interfaz & Previo</h3>
              <ul className="space-y-1 text-sm text-gray-200 drop-shadow">
                <li>• Apollo Solo</li>
                <li>• Focusrite 2i2</li>
                <li>• SPL Gold Mike 9845</li>
              </ul>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 transition-all hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] animate-slide-up delay-300 min-h-[220px] group">
            <Image
              src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941428088-81144e31-a481-43b5-b8c6-6d21416d6672.jpg"
              alt="Escucha"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-in-out z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
            <div className="relative z-20 h-full flex flex-col justify-end">
              <h3 className="mb-2 text-xl font-bold text-white drop-shadow-md">Escucha</h3>
              <ul className="space-y-1 text-sm text-gray-200 drop-shadow">
                <li>• M-Audio BX5</li>
                <li>• 2x Auriculares AKG</li>
                <li>• Samsung 55" Crystal 4K</li>
              </ul>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-card-border bg-card-bg p-6 transition-all hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(30,58,138,0.2)] animate-slide-up delay-400 min-h-[220px] group">
            <Image
              src="https://yzhyucbotumzybntdcpd.supabase.co/storage/v1/object/public/galeria/1776941483912-4e6d5084-4718-4368-8248-7bbb31bc67f8.jpg"
              alt="Instrumentos y Edición"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-[center_70%] opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-in-out z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
            <div className="relative z-20 h-full flex flex-col justify-end">
              <h3 className="mb-2 text-xl font-bold text-white drop-shadow-md">Producción</h3>
              <ul className="space-y-1 text-sm text-gray-200 drop-shadow">
                <li>• Mesa Millenium</li>
                <li>• Teclado Alesis 64</li>
                <li>• FL Studio & Plugins Pro</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Galería Preview ───────────────────────────────── */}
      <section className="border-t border-card-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Dentro de Garage Studios</h2>
            <p className="mt-2 text-muted">
              Un vistazo al estudio, al equipo y al ambiente donde se crea cada proyecto.
            </p>
          </div>
          {previewGallery && previewGallery.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {previewGallery.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">
              Pronto subiremos fotos de nuestro estudio.
            </p>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/galeria"
              className="text-sm font-medium text-accent hover:underline"
            >
              Ver galería completa →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Garage Visuals (Teaser) ───────────────────────── */}
      <section className="border-t border-card-border bg-gradient-to-r from-card-bg to-primary/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row">
          <div className="max-w-2xl text-center md:text-left">
            <div className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              División Audiovisual
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">Garage <span className="text-primary">Visuals</span></h2>
            <p className="mt-4 text-lg text-gray-300">
              Elevamos tu imagen al mismo nivel que tu sonido con videoclips en 4K, sesiones fotográficas y contenido para redes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/visuals"
                className="rounded-lg bg-primary px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(30,58,138,0.4)]"
              >
                Ver servicios audiovisuales
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 gap-4 text-5xl">
            🎥 📸 📱
          </div>
        </div>
      </section>

      {/* ── Contacto Rápido ───────────────────────────────── */}
      <section className="border-t border-card-border bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="animate-fade-in delay-100">
              <h2 className="text-3xl font-bold sm:text-4xl">Hablemos sobre tu sonido</h2>
              <p className="mt-4 text-lg text-muted">
                ¿Listo para grabar? Escríbenos y te responderemos en <span className="font-semibold text-white">menos de 24 horas</span> con un presupuesto adaptado a tu proyecto.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">📍</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Ubicación</h3>
                    <p className="mt-1 text-muted">Avenida Parque Central 1<br />Las Palmas de Gran Canaria</p>

                    <div className="mt-4 overflow-hidden rounded-lg border border-card-border shadow-md">
                      <div className="h-[150px] w-full bg-black/50 relative">
                        <iframe
                          src="https://maps.google.com/maps?q=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria&t=k&z=17&ie=UTF8&iwloc=&output=embed"
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
                          href="https://www.google.com/maps/dir/?api=1&destination=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/20 hover:text-primary"
                        >
                          Cómo llegar <span aria-hidden="true">→</span>
                        </a>
                        <a
                          href="https://www.google.com/maps/search/?api=1&query=Avenida+Parque+Central+1,+Las+Palmas+de+Gran+Canaria"
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">🕒</div>
                  <div>
                    <h3 className="font-semibold text-white">Horarios</h3>
                    <p className="mt-1 text-sm text-muted">L-V: 16:00 - 22:00<br />Sáb: 10:00 - 00:00<br />Dom: 15:00 - 22:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">✉️</div>
                  <div>
                    <h3 className="font-semibold text-white">Email directo</h3>
                    <p className="mt-1 text-muted hover:text-white transition-colors"><a href="mailto:hola@garagestudios.com">hola@garagestudios.com</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">📱</div>
                  <div>
                    <h3 className="font-semibold text-white">Síguenos en redes</h3>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <a href="https://www.instagram.com/gstudios_lp/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white transition-colors">Instagram: @gstudios_lp</a>
                      <a href="https://www.tiktok.com/@garage_studios" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-white transition-colors">TikTok: @garage_studios</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-slide-up delay-200">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                Respuesta en menos de 24h
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
