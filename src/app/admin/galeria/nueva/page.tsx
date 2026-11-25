"use client";

import { useState, useTransition, useRef } from "react";
import { uploadImageAction } from "@/app/actions/galeria";
import AdminNav from "@/components/admin/AdminNav";
import { Field, FormActions, Notice, Page, Panel, buttonClass } from "@/components/admin/ui";

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
    <Page width="medium">
      <AdminNav title="Subir imagen" description="Se mostrará en la galería de la web." />

      <Panel>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Imagen"
            htmlFor="imagen-archivo"
            required
            hint="JPG, PNG, WebP o GIF, máximo 5 MB."
          >
            <input
              id="imagen-archivo"
              ref={fileInputRef}
              name="archivo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              onChange={handleFileChange}
              aria-describedby="imagen-archivo-ayuda"
              className="w-full text-[13px]"
            />
          </Field>

          {preview && (
            <div className="overflow-hidden rounded-lg border border-gs-line bg-gs-sunken">
              {/* Vista previa local (data:) que next/image no puede optimizar */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Vista previa de la imagen seleccionada"
                className="mx-auto h-64 w-full object-contain"
              />
            </div>
          )}

          <Field label="Título" htmlFor="imagen-titulo" required>
            <input
              id="imagen-titulo"
              name="titulo"
              type="text"
              required
              className="w-full"
              placeholder="Ej: Sala de grabación principal"
            />
          </Field>

          <Field label="Descripción" htmlFor="imagen-descripcion" hint="Opcional.">
            <textarea
              id="imagen-descripcion"
              name="descripcion"
              rows={3}
              aria-describedby="imagen-descripcion-ayuda"
              className="w-full"
              placeholder="Breve descripción de la imagen"
            />
          </Field>

          {error && <Notice title="No se pudo subir la imagen">{error}</Notice>}

          <FormActions>
            <button type="submit" disabled={isPending} className={buttonClass("primary")}>
              {isPending ? "Subiendo imagen..." : "Subir imagen"}
            </button>
          </FormActions>
        </form>
      </Panel>
    </Page>
  );
}
