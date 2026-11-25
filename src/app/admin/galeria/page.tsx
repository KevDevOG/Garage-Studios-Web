import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { plural } from "@/lib/format";
import AdminNav from "@/components/admin/AdminNav";
import DeleteImageButton from "@/components/admin/DeleteImageButton";
import { EmptyState, LinkButton, Page, buttonClass } from "@/components/admin/ui";

export default async function AdminGaleriaPage() {
  const supabase = await createClient();

  const { data: imagenes } = await supabase
    .from("imagen")
    .select("id, titulo, descripcion, url_imagen")
    .order("created_at", { ascending: false });

  const total = imagenes?.length ?? 0;

  return (
    <Page width="wide">
      <AdminNav
        title="Galería"
        description={total > 0 ? `${plural(total, "imagen publicada", "imágenes publicadas")} en la web.` : undefined}
        actions={
          <LinkButton href="/admin/galeria/nueva" variant="primary">
            <Plus aria-hidden strokeWidth={2} />
            Subir imagen
          </LinkButton>
        }
      />

      {!imagenes || imagenes.length === 0 ? (
        <div className="rounded-lg border border-gs-line bg-gs-surface">
          <EmptyState
            title="La galería está vacía"
            hint="Sube la primera imagen para que aparezca en la web del estudio."
            action={
              <LinkButton href="/admin/galeria/nueva" variant="secondary">
                Subir imagen
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {imagenes.map((img, i) => (
            <li
              key={img.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-gs-line bg-gs-surface"
            >
              <div className="relative aspect-square bg-gs-sunken">
                <Image
                  src={img.url_imagen}
                  alt={img.titulo}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                  priority={i < 4}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[13px] font-medium text-gs-paper" title={img.titulo}>
                    {img.titulo}
                  </h2>
                  {img.descripcion && (
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-gs-faint">{img.descripcion}</p>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <Link
                    href={`/admin/galeria/${img.id}`}
                    className={buttonClass("secondary", "sm")}
                    aria-label={`Editar imagen ${img.titulo}`}
                  >
                    <Pencil aria-hidden strokeWidth={1.75} />
                    Editar
                  </Link>
                  <DeleteImageButton id={img.id} titulo={img.titulo} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
