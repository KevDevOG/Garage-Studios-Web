"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createVisualsImages } from "@/app/actions/visuals";
import { ArrowLeft, UploadCloud, X, Trash2 } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { Field, FormActions, LinkButton, Notice, Page, Panel, buttonClass } from "@/components/admin/ui";
import { FileZone, ModeToggle, PublicacionChecks, TipoSelect, VistaPrevia } from "@/components/admin/visuals/FormPieces";

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

export default function NuevaVisualImagenPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [manualUrl, setManualUrl] = useState<string>("");
  const [manualUrlPreview, setManualUrlPreview] = useState<string | null>(null);

  // Limpiar URLs de vista previa para evitar fugas de memoria
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  // Manejar cambio de archivos
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError("");

    // 1. Validar límite máximo estricto de 20 imágenes en total
    if (selectedFiles.length + files.length > 20) {
      setError("Límite superado: puedes subir un máximo de 20 imágenes por lote.");
      e.target.value = "";
      return;
    }

    const newFiles: FileWithPreview[] = [];
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    for (const file of files) {
      // 2. Validar tamaño por archivo (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`El archivo "${file.name}" supera el tamaño máximo permitido de 5 MB.`);
        // Si hay algún archivo no válido, cancelamos todo el lote entrante para seguridad
        e.target.value = "";
        return;
      }

      // 3. Validar tipo
      if (!allowed.includes(file.type)) {
        setError(`Formato no permitido para "${file.name}". Solo se aceptan imágenes JPEG, PNG o WEBP.`);
        e.target.value = "";
        return;
      }

      newFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  // Quitar archivo específico de la lista de subida antes de enviar
  function removeFile(indexToRemove: number) {
    setSelectedFiles((prev) => {
      const fileToInfo = prev[indexToRemove];
      if (fileToInfo) {
        URL.revokeObjectURL(fileToInfo.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  }

  // Enviar formulario
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const titulo = (form.elements.namedItem("titulo") as HTMLInputElement).value;
    const descripcion = (form.elements.namedItem("descripcion") as HTMLTextAreaElement).value;
    const tipo = (form.elements.namedItem("tipo") as HTMLSelectElement).value;
    const orden = (form.elements.namedItem("orden") as HTMLInputElement).value;
    const activo = (form.elements.namedItem("activo") as HTMLInputElement).checked;
    const destacado = (form.elements.namedItem("destacado") as HTMLInputElement).checked;

    // Crear FormData programático
    const formData = new FormData();
    formData.set("titulo", titulo);
    formData.set("descripcion", descripcion);
    formData.set("tipo", tipo);
    formData.set("orden", orden);
    formData.set("activo", activo ? "on" : "off");
    formData.set("destacado", destacado ? "on" : "off");

    if (uploadMode === "file") {
      if (selectedFiles.length === 0) {
        setError("Debes seleccionar al menos una imagen para subir.");
        setLoading(false);
        return;
      }
      // Agregar todos los archivos validados y seleccionados
      selectedFiles.forEach((item) => {
        formData.append("imagen_archivos", item.file);
      });
    } else {
      if (!manualUrl.trim()) {
        setError("Debes introducir una URL de imagen manual.");
        setLoading(false);
        return;
      }
      formData.set("url_imagen", manualUrl.trim());
    }

    const result = await createVisualsImages(formData);

    if (!result.success) {
      setError(result.error || "Ocurrió un error al guardar las imágenes.");
      setLoading(false);
    } else {
      router.push("/admin/visuals");
      router.refresh();
    }
  }

  // Helper para formatear tamaño de archivos
  function formatSize(bytes: number) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }

  const submitLabel =
    uploadMode === "file" && selectedFiles.length > 1 ? `Subir ${selectedFiles.length} imágenes` : "Subir imagen";

  return (
    <Page width="medium">
      <AdminNav
        title="Subir imágenes"
        description="Sube uno o varios archivos a la galería de Visuals de una sola vez."
        actions={
          <LinkButton href="/admin/visuals" variant="ghost">
            <ArrowLeft aria-hidden /> Volver a Visuals
          </LinkButton>
        }
      />

      {error && (
        <Notice tone="bad" title="No se ha podido continuar" className="mb-4">
          {error}
        </Notice>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <Panel title="Imágenes">
          <div className="space-y-4">
            <Field
              label={uploadMode === "file" ? "Título base" : "Título"}
              htmlFor="titulo"
              hint={
                uploadMode === "file"
                  ? "Opcional. Si lo rellenas, se generarán de forma numerada (ej: Título 1, Título 2). Si se deja vacío, se guardarán sin título (nunca se usará el nombre del archivo)."
                  : "Opcional. Si se deja vacío, la imagen no mostrará título público (nunca se usará el nombre del archivo)."
              }
            >
              <input
                type="text"
                id="titulo"
                name="titulo"
                aria-describedby="titulo-ayuda"
                className="w-full"
                placeholder="Opcional"
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
                }}
                fileLabel="Subir archivos"
                urlLabel="Usar una URL"
                label="Origen de la imagen"
              />

              {uploadMode === "file" ? (
                <div className="space-y-3">
                  <FileZone
                    id="imagen_archivos"
                    name="imagen_archivos"
                    multiple
                    onChange={handleFileChange}
                    title="Elegir archivos o arrastrarlos aquí"
                    hint="Solo JPG, PNG y WEBP, máximo 5 MB por archivo y 20 archivos por lote."
                  />

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-gs-soft">
                        <span role="status">
                          {selectedFiles.length} de 20 seleccionadas
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                            setSelectedFiles([]);
                          }}
                          className={buttonClass("ghost", "sm")}
                        >
                          <Trash2 aria-hidden /> Quitar todas
                        </button>
                      </div>
                      <ul className="grid max-h-[320px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                        {selectedFiles.map((item, idx) => (
                          <li
                            key={`${item.file.name}-${idx}`}
                            className="flex items-center gap-3 rounded-md border border-gs-line bg-gs-raised p-2"
                          >
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-gs-line bg-gs-sunken">
                              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa blob: local */}
                              <img
                                src={item.previewUrl}
                                alt={`Vista previa de ${item.file.name}`}
                                loading="lazy"
                                decoding="async"
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] text-gs-paper" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[12px] text-gs-faint">{formatSize(item.file.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className={buttonClass("ghost", "sm", "w-10 px-0 sm:w-8")}
                              aria-label={`Quitar ${item.file.name} de la selección`}
                              title="Quitar de la selección"
                            >
                              <X aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Field
                    label="URL de la imagen"
                    htmlFor="url_imagen"
                    hint="Introduce una dirección URL completa o ruta en el directorio /public."
                  >
                    <input
                      type="text"
                      id="url_imagen"
                      name="url_imagen"
                      value={manualUrl}
                      onChange={(e) => {
                        setManualUrl(e.target.value);
                        setManualUrlPreview(e.target.value || null);
                      }}
                      aria-describedby="url_imagen-ayuda"
                      className="w-full"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                  </Field>

                  {manualUrlPreview && <VistaPrevia src={manualUrlPreview} alt="Vista previa de la URL indicada" />}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Detalles">
          <div className="space-y-4">
            <Field
              label="Descripción"
              htmlFor="descripcion"
              hint="Opcional. Se aplicará a todas las imágenes del lote."
            >
              <textarea id="descripcion" name="descripcion" rows={3} aria-describedby="descripcion-ayuda" className="w-full" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <TipoSelect />
              <Field
                label="Orden inicial"
                htmlFor="orden"
                hint={
                  uploadMode === "file" && selectedFiles.length > 1
                    ? "Se incrementará de 1 en 1 de forma automática."
                    : undefined
                }
              >
                <input
                  type="number"
                  id="orden"
                  name="orden"
                  defaultValue={999}
                  aria-describedby={uploadMode === "file" && selectedFiles.length > 1 ? "orden-ayuda" : undefined}
                  className="w-full"
                />
              </Field>
            </div>

            <PublicacionChecks activoDefault />
          </div>
        </Panel>

        <FormActions>
          <button type="submit" disabled={loading} className={buttonClass("primary", "md")}>
            <UploadCloud aria-hidden />
            {loading ? "Subiendo…" : submitLabel}
          </button>
          <LinkButton href="/admin/visuals" variant="ghost">
            Cancelar
          </LinkButton>
          {loading && (
            <span role="status" className="text-[13px] text-gs-soft">
              Subiendo y guardando, no cierres esta página.
            </span>
          )}
        </FormActions>
      </form>
    </Page>
  );
}
