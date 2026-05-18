"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createVisualsImages } from "@/app/actions/visuals";
import { ArrowLeft, Save, UploadCloud, X, Trash2 } from "lucide-react";

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

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nueva Imagen / Lote de Imágenes (Visuals)</h1>
          <p className="text-xs text-gray-400 mt-1">Sube uno o varios archivos a la galería de Garage Visuals de forma simultánea.</p>
        </div>
        <Link
          href="/admin/visuals"
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          <div className="space-y-5">
            
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-gray-300">
                {uploadMode === "file" ? "Título base" : "Título"}
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Opcional. Si lo dejas vacío, las imágenes no mostrarán título en la web."
              />
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {uploadMode === "file"
                  ? "Opcional. Si lo rellenas, se generarán de forma numerada (ej: Título 1, Título 2). Si se deja vacío, se guardarán sin título (nunca se usará el nombre del archivo)."
                  : "Opcional. Si se deja vacío, la imagen no mostrará título público (nunca se usará el nombre del archivo)."}
              </p>
            </div>

            {/* Selector de modo y campo de imagen */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Imágenes a Subir *
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("file");
                    setError("");
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                    uploadMode === "file"
                      ? "bg-accent text-black border-accent"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Subir Archivos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("url");
                    setError("");
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                    uploadMode === "url"
                      ? "bg-accent text-black border-accent"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  URL Manual
                </button>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-4">
                  {/* Selector de archivos múltiples */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 hover:border-accent/40 transition-all p-6 text-center">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-300">
                          <span className="font-semibold text-accent">Haz clic para buscar</span> o arrastra tus fotos
                        </p>
                        <p className="text-xs text-muted leading-relaxed">Solo JPG, PNG y WEBP (máx. 5 MB por archivo) • Límite máximo: 20 archivos</p>
                      </div>
                      <input
                        type="file"
                        id="imagen_archivos"
                        name="imagen_archivos"
                        multiple
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {/* Previsualización del lote de imágenes */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <span>Lote Seleccionado ({selectedFiles.length} de 20)</span>
                        <button
                          type="button"
                          onClick={() => {
                            selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                            setSelectedFiles([]);
                          }}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold lowercase tracking-normal"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Quitar todo
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                        {selectedFiles.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-2 relative group"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/50">
                              <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-gray-200" title={item.file.name}>{item.file.name}</p>
                              <p className="text-[10px] text-gray-500 font-bold mt-0.5">{formatSize(item.file.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="text-red-400 hover:text-red-300 hover:bg-white/5 rounded-full p-1 transition-colors"
                              title="Quitar de la selección"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      id="url_imagen"
                      name="url_imagen"
                      value={manualUrl}
                      onChange={(e) => {
                        setManualUrl(e.target.value);
                        setManualUrlPreview(e.target.value || null);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Ej: https://images.unsplash.com/photo-..."
                    />
                    <p className="text-xs text-muted">
                      Introduce una dirección URL completa o ruta en el directorio /public.
                    </p>
                  </div>

                  {manualUrlPreview && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20 max-w-sm">
                      <img src={manualUrlPreview} alt="Vista previa manual" className="h-full w-full object-cover" />
                      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                        Vista Previa
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Descripción Común */}
            <div>
              <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-gray-300">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Esta descripción se aplicará a todas las imágenes del lote."
              />
            </div>

            {/* Tipo de Contenido e Incremento de Orden */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-gray-300">
                  Tipo de Contenido
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="fotos">Sesión de fotos</option>
                  <option value="grabaciones">Sesión de grabación</option>
                  <option value="rodajes">Rodaje</option>
                </select>
              </div>

              <div>
                <label htmlFor="orden" className="mb-1 block text-sm font-medium text-gray-300">
                  Orden Inicial
                </label>
                <input
                  type="number"
                  id="orden"
                  name="orden"
                  defaultValue={999}
                  className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {uploadMode === "file" && selectedFiles.length > 1 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Se incrementará de 1 en 1 de forma automática.
                  </p>
                )}
              </div>
            </div>

            {/* Checkboxes de Activo y Destacado */}
            <div className="flex gap-6 border-t border-card-border pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  defaultChecked
                  className="rounded border-white/10 bg-black/50 text-accent focus:ring-accent focus:ring-offset-black"
                />
                Activo (Público)
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="destacado"
                  name="destacado"
                  className="rounded border-white/10 bg-black/50 text-accent focus:ring-accent focus:ring-offset-black"
                />
                Destacado
              </label>
            </div>
          </div>

          {/* Botón de Envío Dinámico */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading
                ? "Guardando..."
                : uploadMode === "file" && selectedFiles.length > 1
                ? `Guardar ${selectedFiles.length} imágenes`
                : "Guardar imagen"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
