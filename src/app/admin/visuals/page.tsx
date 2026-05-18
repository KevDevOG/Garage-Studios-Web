import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getAdminVisualsImages, VisualImage } from "@/app/actions/visuals";
import { Camera, Plus, CheckCircle2, XCircle, Film, FolderHeart } from "lucide-react";
import VisualsQuickActions from "@/components/admin/VisualsQuickActions";

export default async function AdminVisualsPage() {
  const imagenes = await getAdminVisualsImages();

  // Agrupamiento unificado simplificado
  const fotos = imagenes.filter(img => img.tipo === "fotos");
  const grabaciones = imagenes.filter(img => img.tipo === "grabaciones");
  const rodajes = imagenes.filter(img => img.tipo === "rodajes");

  const renderSection = (title: string, list: VisualImage[], icon: React.ReactNode) => {
    return (
      <div className="mb-12">
        <div className="mb-4 flex items-center gap-2 border-b border-card-border pb-2">
          {icon}
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-gray-300">
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card-bg/30 p-8 text-center">
            <p className="text-sm text-muted">
              No hay imágenes en la sección de {title.toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((img) => (
              <div
                key={img.id}
                className={`group overflow-hidden rounded-lg border transition-all bg-card-bg/60 ${
                  img.activo ? "border-card-border" : "border-red-900/50 opacity-60"
                } ${img.destacado ? "ring-1 ring-accent" : ""}`}
              >
                {/* Imagen real */}
                <div className="relative aspect-square overflow-hidden bg-black/20">
                  <img
                    src={img.url_imagen}
                    alt={img.titulo || "Imagen de Visuals"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {img.destacado && (
                      <span className="rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-bold text-black uppercase">
                        Destacado
                      </span>
                    )}
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                      {img.tipo === "fotos" ? "Fotos" : img.tipo === "grabaciones" ? "Grabación" : "Rodaje"}
                    </span>
                  </div>
                </div>

                {/* Info y acciones */}
                <div className="p-3 relative">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-semibold truncate flex-1 text-white">
                      {img.titulo || <span className="text-gray-500 italic font-normal">Sin título</span>}
                    </h4>
                    {img.activo ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                  </div>
                  {img.descripcion && (
                    <p className="mt-1 text-xs text-muted line-clamp-2">
                      {img.descripcion}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3 text-xs">
                    <span className="text-muted">Orden: {img.orden}</span>
                    <div className="flex items-center gap-2">
                      <VisualsQuickActions id={img.id} activo={img.activo} titulo={img.titulo} />
                      <Link
                        href={`/admin/visuals/${img.id}`}
                        className="rounded bg-white/5 px-2.5 py-1.5 font-bold text-accent transition-colors hover:bg-white/10 hover:text-accent-hover text-[11px] uppercase tracking-wider"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Garage Visuals" />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Galería de Visuals</h2>
          <p className="text-xs text-muted mt-1">Organiza y gestiona las imágenes y videos del portafolio visual</p>
        </div>
        <Link
          href="/admin/visuals/nueva"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          <Plus className="w-4 h-4" /> Subir Lote de Imágenes
        </Link>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        {imagenes.length === 0 ? (
          <div className="py-16 text-center">
            <Camera className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted">
              No hay imágenes en la galería de Visuals. Sube la primera usando el botón de arriba.
            </p>
          </div>
        ) : (
          <>
            {renderSection("Sesiones de fotos", fotos, <Camera className="w-4 h-4 text-accent" />)}
            {renderSection("Sesiones de grabación", grabaciones, <FolderHeart className="w-4 h-4 text-accent" />)}
            {renderSection("Rodajes", rodajes, <Film className="w-4 h-4 text-accent" />)}
          </>
        )}
      </div>
    </section>
  );
}
