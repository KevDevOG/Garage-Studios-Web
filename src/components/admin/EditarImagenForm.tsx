"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateImageAction } from "@/app/actions/galeria";
import { Field, FormActions, Notice, Panel, buttonClass } from "@/components/admin/ui";

interface ImagenRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  url_imagen: string;
}

export default function EditarImagenForm({ imagen }: { imagen: ImagenRow }) {
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
    <Panel>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen actual como referencia */}
        <div className="relative h-64 overflow-hidden rounded-lg border border-gs-line bg-gs-sunken">
          <Image
            src={imagen.url_imagen}
            alt={imagen.titulo}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
          />
        </div>

        <Field label="Título" htmlFor="imagen-titulo" required>
          <input
            id="imagen-titulo"
            name="titulo"
            type="text"
            defaultValue={imagen.titulo}
            required
            className="w-full"
          />
        </Field>

        <Field label="Descripción" htmlFor="imagen-descripcion" hint="Opcional.">
          <textarea
            id="imagen-descripcion"
            name="descripcion"
            defaultValue={imagen.descripcion || ""}
            rows={3}
            aria-describedby="imagen-descripcion-ayuda"
            className="w-full"
          />
        </Field>

        {error && <Notice title="No se pudo guardar">{error}</Notice>}

        <FormActions>
          <button type="submit" disabled={isPending} className={buttonClass("primary")}>
            {isPending ? "Guardando..." : "Guardar imagen"}
          </button>
        </FormActions>
      </form>
    </Panel>
  );
}
