"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { getVisualsImageById, updateVisualsImage, deleteVisualsImage, toggleVisualsImageActive, VisualImage } from "@/app/actions/visuals";
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { Badge, Field, FormActions, LinkButton, Notice, Page, Panel, buttonClass } from "@/components/admin/ui";
import { FileZone, ModeToggle, PublicacionChecks, TipoSelect, VistaPrevia } from "@/components/admin/visuals/FormPieces";

export default function EditarVisualImagenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [imagen, setImagen] = useState<VisualImage | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const data = await getVisualsImageById(id);
        if (!data) {
          setError("Imagen no encontrada o ya ha sido eliminada.");
        } else {
          setImagen(data);
          setPreviewUrl(data.url_imagen);
        }
      } catch (err) {
        console.error("[Visuals] Error al cargar la imagen:", err);
        setError("No se pudo cargar la imagen. Vuelve al listado e inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño máximo de 5 MB
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen supera el tamaño máximo permitido de 5 MB");
        setPreviewUrl(imagen?.url_imagen || null);
        setFileName("");
        e.target.value = "";
        return;
      }
      // Validar tipos de archivos permitidos
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        setError("Formato de imagen no permitido. Solo se acepta JPG, PNG o WEBP.");
        setPreviewUrl(imagen?.url_imagen || null);
        setFileName("");
        e.target.value = "";
        return;
      }
      setError("");
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(imagen?.url_imagen || null);
      setFileName("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;

    setError("");
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    if (!formData.has("activo")) formData.set("activo", "off");
    if (!formData.has("destacado")) formData.set("destacado", "off");

    const fileInput = formData.get("imagen_archivo") as File | null;
    const urlInput = formData.get("url_imagen") as string;

    if (uploadMode === "file" && (!fileInput || fileInput.size === 0) && !imagen?.url_imagen) {
      setError("Debes subir un archivo para reemplazar la imagen actual.");
      setSaving(false);
      return;
    }

    if (uploadMode === "url" && !urlInput.trim()) {
      setError("La URL de la imagen no puede estar vacía.");
      setSaving(false);
      return;
    }

    const result = await updateVisualsImage(id, formData);

    if (!result.success) {
      setError(result.error || "Ocurrió un error al actualizar la imagen.");
      setSaving(false);
    } else {
      router.push("/admin/visuals");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!id || !confirm("¿Estás seguro de que quieres eliminar esta imagen? Esta acción no se puede deshacer de forma sencilla.")) return;

    setDeleting(true);
    const result = await deleteVisualsImage(id);

    if (!result.success) {
      setError(result.error || "Error al eliminar");
      setDeleting(false);
    } else {
      router.push("/admin/visuals");
      router.refresh();
    }
  }

  async function handleToggleActive() {
    if (!id || !imagen) return;

    setToggling(true);
    const result = await toggleVisualsImageActive(id);

    if (!result.success) {
      setError(result.error || "Error al cambiar el estado");
    } else {
      setImagen({ ...imagen, activo: !imagen.activo });
      router.refresh();
    }
    setToggling(false);
  }

  const volver = (
    <LinkButton href="/admin/visuals" variant="ghost">
      <ArrowLeft aria-hidden /> Volver a Visuals
    </LinkButton>
  );

  if (loading) {
    return (
      <Page width="medium">
        <AdminNav title="Editar imagen" actions={volver} />
        <p role="status" className="text-[14px] text-gs-soft">
          Cargando datos…
        </p>
      </Page>
    );
  }

  if (!imagen) {
    return (
      <Page width="medium">
        <AdminNav title="Editar imagen" actions={volver} />
        <Notice tone="bad" title="No se puede editar">
          {error || "Imagen no encontrada"}
        </Notice>
      </Page>
    );
  }

  const creada = new Date(imagen.created_at || "").toLocaleDateString("es-ES");

  return (
    <Page width="medium">
      <AdminNav
        title="Editar imagen"
        description="Modifica los detalles o reemplaza la imagen seleccionada."
        actions={volver}
      />

      {error && (
        <Notice tone="bad" title="No se ha podido continuar" className="mb-4">
          {error}
        </Notice>
      )}

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {imagen.url_imagen && (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-gs-line bg-gs-sunken">
                <Image src={imagen.url_imagen} alt="" fill sizes="56px" loading="lazy" decoding="async" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-gs-paper">
                {imagen.titulo || <span className="font-normal text-gs-faint">Sin título</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gs-faint">
                <Badge plain tone={imagen.activo ? "ok" : "neutral"}>
                  {imagen.activo ? "Visible" : "Oculta"}
                </Badge>
                <span>Añadida el {creada}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={toggling}
              className={buttonClass("secondary", "md")}
            >
              {imagen.activo ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {imagen.activo ? "Ocultar" : "Publicar"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={buttonClass("danger", "md")}
            >
              <Trash2 aria-hidden />
              {deleting ? "Borrando…" : "Borrar imagen"}
            </button>
          </div>
        </div>
      </Panel>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <Panel title="Imagen">
          <div className="space-y-4">
            <Field
              label="Título"
              htmlFor="titulo"
              hint="Opcional. Si lo dejas vacío, la imagen no mostrará título público (nunca se usará el nombre del archivo)."
            >
              <input
                type="text"
                id="titulo"
                name="titulo"
                defaultValue={imagen.titulo || ""}
                aria-describedby="titulo-ayuda"
                className="w-full"
              />
            </Field>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-gs-paper">
                Origen de la imagen
                <span aria-hidden className="text-gs-amber">
                  {" "}
                  *
                </span>
              </p>
              <ModeToggle
                mode={uploadMode}
                onChange={(m) => {
                  setUploadMode(m);
                  setError("");
                  if (m === "url") setPreviewUrl(imagen.url_imagen || null);
                }}
                fileLabel="Subir archivo nuevo"
                urlLabel="Usar una URL"
                label="Origen de la imagen"
              />

              {uploadMode === "file" ? (
                <div className="space-y-3">
                  <FileZone
                    id="imagen_archivo"
                    name="imagen_archivo"
                    onChange={handleFileChange}
                    title="Elegir archivo para reemplazar o arrastrarlo aquí"
                    hint="JPG, PNG o WEBP, máximo 5 MB."
                  />

                  {fileName && (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-gs-line bg-gs-raised px-3 py-1.5 text-[13px] text-gs-soft">
                      <span role="status" className="truncate">
                        Archivo seleccionado: {fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFileName("");
                          setPreviewUrl(imagen.url_imagen || null);
                          const input = document.getElementById("imagen_archivo") as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        className={buttonClass("ghost", "sm")}
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Field
                  label="URL de la imagen"
                  htmlFor="url_imagen"
                  hint="Introduce una dirección URL completa o ruta en el directorio /public."
                >
                  <input
                    type="text"
                    id="url_imagen"
                    name="url_imagen"
                    defaultValue={imagen.url_imagen}
                    onChange={(e) => setPreviewUrl(e.target.value || null)}
                    aria-describedby="url_imagen-ayuda"
                    className="w-full"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </Field>
              )}

              {previewUrl && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[12px] text-gs-faint">Vista previa</p>
                  <VistaPrevia src={previewUrl} alt="Vista previa de la imagen" />
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Detalles">
          <div className="space-y-4">
            <Field label="Descripción" htmlFor="descripcion" hint="Opcional.">
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                defaultValue={imagen.descripcion || ""}
                aria-describedby="descripcion-ayuda"
                className="w-full"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <TipoSelect defaultValue={imagen.tipo} />
              <Field label="Orden" htmlFor="orden">
                <input type="number" id="orden" name="orden" defaultValue={imagen.orden} className="w-full" />
              </Field>
            </div>

            <PublicacionChecks activoDefault={imagen.activo} destacadoDefault={imagen.destacado} />
          </div>
        </Panel>

        <FormActions>
          <button type="submit" disabled={saving} className={buttonClass("primary", "md")}>
            <Save aria-hidden />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <LinkButton href="/admin/visuals" variant="ghost">
            Cancelar
          </LinkButton>
          {saving && (
            <span role="status" className="text-[13px] text-gs-soft">
              Guardando cambios, no cierres esta página.
            </span>
          )}
        </FormActions>
      </form>
    </Page>
  );
}
