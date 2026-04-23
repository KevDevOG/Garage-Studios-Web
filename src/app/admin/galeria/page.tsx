import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import DeleteImageButton from "@/components/admin/DeleteImageButton";

export default async function AdminGaleriaPage() {
  const supabase = await createClient();

  const { data: imagenes } = await supabase
    .from("imagen")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <AdminNav title="Galería" />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/galeria/nueva"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover"
        >
          + Subir Imagen
        </Link>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        {!imagenes || imagenes.length === 0 ? (
          <p className="text-sm text-muted">
            No hay imágenes en la galería. Sube la primera usando el botón de
            arriba.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imagenes.map((img) => (
              <div
                key={img.id}
                className="group overflow-hidden rounded-lg border border-card-border"
              >
                {/* Imagen real */}
                <div className="relative aspect-square overflow-hidden bg-black/20">
                  <img
                    src={img.url_imagen}
                    alt={img.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Info y acciones */}
                <div className="bg-card-bg p-3">
                  <h3 className="text-sm font-semibold">{img.titulo}</h3>
                  {img.descripcion && (
                    <p className="mt-1 text-xs text-muted line-clamp-2">
                      {img.descripcion}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 border-t border-card-border pt-3 text-xs">
                    <Link
                      href={`/admin/galeria/${img.id}`}
                      className="text-accent transition-colors hover:text-accent-hover hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteImageButton id={img.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
