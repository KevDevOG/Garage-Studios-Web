"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getVisualsImageById, updateVisualsImage, deleteVisualsImage, toggleVisualsImageActive, VisualImage } from "@/app/actions/visuals";
import { ArrowLeft, Save, Trash2, Power, PowerOff, UploadCloud } from "lucide-react";

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
      } catch (err: any) {
        setError(err.message || "Error al cargar la imagen");
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

  if (loading) {
    return <div className="p-16 text-center text-muted">Cargando datos...</div>;
  }

  if (!imagen && !loading) {
    return (
      <div className="p-16 text-center text-red-400">
        <p className="mb-4">{error || "Imagen no encontrada"}</p>
        <Link href="/admin/visuals" className="text-accent underline">Volver a la galería</Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Editar Imagen (Visuals)</h1>
          <p className="text-xs text-gray-400 mt-1">Modifica los detalles o reemplaza la foto seleccionada.</p>
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

        <div className="mb-6 flex items-center justify-between border-b border-card-border pb-6">
          <div className="flex items-center gap-4">
            <img src={imagen?.url_imagen} alt="Preview" className="w-16 h-16 rounded object-cover border border-white/10 bg-black/20" />
            <div>
              <p className="font-semibold text-sm text-white">
                {imagen?.titulo || <span className="text-gray-500 italic font-normal">Sin título</span>}
              </p>
              <p className="text-xs text-muted">Añadida el {new Date(imagen?.created_at || "").toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                imagen?.activo 
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 animate-pulse-subtle" 
                  : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
              }`}
            >
              {imagen?.activo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
              {imagen?.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          <div className="space-y-4">
            <div>
              <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-gray-300">
                Título (opcional)
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                defaultValue={imagen?.titulo || ""}
                className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Si lo dejas vacío, no mostrará título público."
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional. Si lo dejas vacío, la imagen no mostrará título público (nunca se usará el nombre del archivo).
              </p>
            </div>

            {/* Selector de modo y campo de imagen */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Imagen de la Galería *
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
                  Subir Nuevo Archivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("url");
                    setError("");
                    setPreviewUrl(imagen?.url_imagen || null);
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
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-black/30 hover:bg-black/50 hover:border-accent/40 transition-all p-6 text-center">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-300">
                          <span className="font-semibold text-accent">Haz clic para reemplazar</span> o arrastra
                        </p>
                        <p className="text-xs text-muted">JPG, PNG o WEBP (máx. 5 MB)</p>
                      </div>
                      <input
                        type="file"
                        id="imagen_archivo"
                        name="imagen_archivo"
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {fileName && (
                    <div className="flex items-center justify-between text-xs text-muted bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                      <span className="truncate pr-4">{fileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFileName("");
                          setPreviewUrl(imagen?.url_imagen || null);
                          const input = document.getElementById("imagen_archivo") as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    id="url_imagen"
                    name="url_imagen"
                    defaultValue={imagen?.url_imagen}
                    onChange={(e) => setPreviewUrl(e.target.value || null)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Ej: https://images.unsplash.com/photo-..."
                  />
                  <p className="text-xs text-muted">
                    Introduce una dirección URL completa o ruta en el directorio /public.
                  </p>
                </div>
              )}

              {previewUrl && (
                <div className="relative mt-4 aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/20 max-w-sm">
                  <img src={previewUrl} alt="Vista previa" className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                    Vista Previa
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-gray-300">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                defaultValue={imagen?.descripcion || ""}
                className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-gray-300">
                  Tipo de Contenido
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={imagen?.tipo}
                  className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="fotos">Sesión de fotos</option>
                  <option value="grabaciones">Sesión de grabación</option>
                  <option value="rodajes">Rodaje</option>
                </select>
              </div>

              <div>
                <label htmlFor="orden" className="mb-1 block text-sm font-medium text-gray-300">
                  Orden
                </label>
                <input
                  type="number"
                  id="orden"
                  name="orden"
                  defaultValue={imagen?.orden}
                  className="w-full rounded-lg border border-white/10 bg-black/50 p-2.5 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex gap-6 border-t border-card-border pt-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={imagen?.activo}
                  className="rounded border-white/10 bg-black/50 text-accent focus:ring-accent focus:ring-offset-black"
                />
                Activo (Público)
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="destacado"
                  defaultChecked={imagen?.destacado}
                  className="rounded border-white/10 bg-black/50 text-accent focus:ring-accent focus:ring-offset-black"
                />
                Destacado
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
