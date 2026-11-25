import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import VisualsQuickActions from "@/components/admin/VisualsQuickActions";
import { getAdminVisualsImages } from "@/app/actions/visuals";
import {
  Badge,
  EmptyState,
  LinkButton,
  Page,
  Panel,
  Segmented,
  buttonClass,
  cx,
} from "@/components/admin/ui";

type Tipo = "fotos" | "grabaciones" | "rodajes";

const TIPO_LABEL: Record<Tipo, string> = {
  fotos: "Sesión de fotos",
  grabaciones: "Sesión de grabación",
  rodajes: "Rodaje",
};

const FILTROS: Array<{ value: "todas" | Tipo; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "fotos", label: "Fotos" },
  { value: "grabaciones", label: "Grabaciones" },
  { value: "rodajes", label: "Rodajes" },
];

export default async function AdminVisualsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>;
}) {
  const { tipo: tipoParam } = await searchParams;
  const raw = Array.isArray(tipoParam) ? tipoParam[0] : tipoParam;
  const filtro: "todas" | Tipo = raw === "fotos" || raw === "grabaciones" || raw === "rodajes" ? raw : "todas";

  const imagenes = await getAdminVisualsImages();
  const visibles = filtro === "todas" ? imagenes : imagenes.filter((img) => img.tipo === filtro);

  const conteo = (v: "todas" | Tipo) =>
    v === "todas" ? imagenes.length : imagenes.filter((img) => img.tipo === v).length;

  const items = FILTROS.map((f) => ({
    href: f.value === "todas" ? "/admin/visuals" : `/admin/visuals?tipo=${f.value}`,
    label: `${f.label} (${conteo(f.value)})`,
    active: f.value === filtro,
  }));

  const nueva = (
    <LinkButton href="/admin/visuals/nueva" variant="primary">
      <Plus aria-hidden /> Subir imágenes
    </LinkButton>
  );

  return (
    <Page width="wide">
      <AdminNav
        title="Visuals"
        description="Galería de fotos y vídeo que se muestra en la web pública."
        actions={nueva}
      />

      {imagenes.length === 0 ? (
        <Panel>
          <EmptyState
            title="La galería está vacía"
            hint="Todavía no hay imágenes en Visuals. Sube la primera para que aparezca en la web."
            action={
              <LinkButton href="/admin/visuals/nueva" variant="secondary">
                <Plus aria-hidden /> Subir imágenes
              </LinkButton>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="mb-4 max-w-full overflow-x-auto">
            <Segmented items={items} label="Filtrar por categoría" />
          </div>

          {visibles.length === 0 ? (
            <Panel>
              <EmptyState
                title="No hay imágenes en esta categoría"
                hint="Prueba con otra categoría o sube imágenes nuevas."
                action={
                  <Link href="/admin/visuals" className={buttonClass("secondary", "md")}>
                    Ver todas
                  </Link>
                }
              />
            </Panel>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {visibles.map((img) => {
                const nombre = img.titulo || "Sin título";
                return (
                  <li key={img.id} className="min-w-0 overflow-hidden rounded-lg border border-gs-line bg-gs-surface">
                    <div className="relative aspect-square overflow-hidden bg-gs-sunken">
                      <Image
                        src={img.url_imagen}
                        alt={img.titulo ? `Imagen: ${img.titulo}` : `Imagen sin título (${TIPO_LABEL[img.tipo]})`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        loading="lazy"
                        decoding="async"
                        className={cx("object-cover", !img.activo && "opacity-50")}
                      />
                    </div>
                    <div className="space-y-2 p-2.5">
                      <div className="min-w-0">
                        <p className={cx("truncate text-[13px] font-medium", img.titulo ? "text-gs-paper" : "text-gs-faint")} title={nombre}>
                          {nombre}
                        </p>
                        <p className="truncate text-[12px] text-gs-faint">
                          {TIPO_LABEL[img.tipo]}, orden {img.orden}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <Badge plain tone={img.activo ? "ok" : "neutral"}>
                          {img.activo ? "Visible" : "Oculta"}
                        </Badge>
                        {img.destacado && (
                          <Badge plain tone="amber">
                            Destacada
                          </Badge>
                        )}
                      </div>
                      <div className="-mx-1 flex items-center justify-between border-t border-gs-line pt-1.5">
                        <Link
                          href={`/admin/visuals/${img.id}`}
                          className={buttonClass("ghost", "sm", "w-10 px-0 sm:w-8")}
                          aria-label={`Editar ${nombre}`}
                          title="Editar imagen"
                        >
                          <Pencil aria-hidden />
                        </Link>
                        <VisualsQuickActions id={img.id} activo={img.activo} titulo={img.titulo} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Page>
  );
}
