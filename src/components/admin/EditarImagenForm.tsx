"use client";

import { useState, useTransition } from "react";
import { updateImageAction } from "@/app/actions/galeria";

export default function EditarImagenForm({ imagen }: { imagen: any }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateImageAction(imagen.id, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      {/* Imagen actual como referencia */}
      <div className="overflow-hidden rounded-lg border border-card-border">
        <img
          src={imagen.url_imagen}
          alt={imagen.titulo}
          className="mx-auto max-h-64 object-contain"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Título</label>
        <input
          name="titulo"
          type="text"
          defaultValue={imagen.titulo}
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Descripción <span className="text-muted">(opcional)</span>
        </label>
        <textarea
          name="descripcion"
          defaultValue={imagen.descripcion || ""}
          rows={3}
          className="w-full"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-accent px-4 py-2 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Guardando cambios..." : "Guardar Cambios"}
      </button>
    </form>
  );
}
