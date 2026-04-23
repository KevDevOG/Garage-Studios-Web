"use client";

import { useState, useTransition, useRef } from "react";
import { uploadImageAction } from "@/app/actions/galeria";
import Link from "next/link";

export default function NuevaImagenPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Previsualización local
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await uploadImageAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 border-b border-card-border pb-4">
        <Link
          href="/admin/galeria"
          className="text-sm font-medium text-muted hover:text-white"
        >
          &larr; Volver a Galería
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Subir Imagen</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
      >
        {/* Selector de archivo */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Imagen <span className="text-muted">(JPG, PNG, WebP o GIF — máx. 5 MB)</span>
          </label>
          <input
            ref={fileInputRef}
            name="archivo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            onChange={handleFileChange}
            className="w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black file:transition-colors hover:file:bg-accent-hover"
          />
        </div>

        {/* Previsualización */}
        {preview && (
          <div className="overflow-hidden rounded-lg border border-card-border">
            <img
              src={preview}
              alt="Previsualización"
              className="mx-auto max-h-64 object-contain"
            />
          </div>
        )}

        {/* Título */}
        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <input
            name="titulo"
            type="text"
            required
            className="w-full"
            placeholder="Ej: Sala de grabación principal"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Descripción <span className="text-muted">(opcional)</span>
          </label>
          <textarea
            name="descripcion"
            rows={3}
            className="w-full"
            placeholder="Breve descripción de la imagen..."
          />
        </div>

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Subiendo imagen..." : "Subir Imagen"}
        </button>
      </form>
    </section>
  );
}
