"use client";

import { useState, useTransition } from "react";
import { updateServiceAction } from "@/app/actions/servicios";
import { Field, FormActions, Notice, Panel, buttonClass } from "@/components/admin/ui";

interface ServicioRow {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number | string;
  duracion_minutos: number;
  categoria: string;
  subcategoria: string | null;
  icono: string | null;
  es_pack: boolean;
}

export default function EditarServicioForm({ servicio }: { servicio: ServicioRow }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateServiceAction(servicio.id, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <Panel>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre" htmlFor="servicio-nombre" required>
          <input
            id="servicio-nombre"
            name="nombre"
            type="text"
            defaultValue={servicio.nombre}
            required
            className="w-full"
          />
        </Field>

        <Field label="Descripción" htmlFor="servicio-descripcion" required>
          <textarea
            id="servicio-descripcion"
            name="descripcion"
            defaultValue={servicio.descripcion}
            required
            rows={3}
            className="w-full"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio (€)" htmlFor="servicio-precio" required>
            <input
              id="servicio-precio"
              name="precio"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={servicio.precio}
              required
              className="w-full"
            />
          </Field>
          <Field label="Duración (minutos)" htmlFor="servicio-duracion" required hint="Por ejemplo, 90 son 1 h 30 min.">
            <input
              id="servicio-duracion"
              name="duracion_minutos"
              type="number"
              min="1"
              defaultValue={servicio.duracion_minutos}
              required
              aria-describedby="servicio-duracion-ayuda"
              className="w-full"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="servicio-categoria" required>
            <select
              id="servicio-categoria"
              name="categoria"
              required
              defaultValue={servicio.categoria}
              className="w-full"
            >
              <option value="">Seleccionar...</option>
              <option value="Sonido">Sonido</option>
              <option value="Fotografía y vídeo">Fotografía y Vídeo</option>
              <option value="Diseño">Diseño</option>
              <option value="Packs">Packs</option>
            </select>
          </Field>
          <Field label="Subcategoría" htmlFor="servicio-subcategoria">
            <select
              id="servicio-subcategoria"
              name="subcategoria"
              defaultValue={servicio.subcategoria || ""}
              className="w-full"
            >
              <option value="">Ninguna</option>
              <option value="Planes GST">Planes GST</option>
              <option value="Packs Sonido">Packs Sonido</option>
              <option value="Garage Visuals">Garage Visuals</option>
              <option value="Pack Diseño">Pack Diseño</option>
            </select>
          </Field>
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label="Icono (emoji)" htmlFor="servicio-icono" hint="Se muestra junto al servicio en la web.">
            <input
              id="servicio-icono"
              name="icono"
              type="text"
              className="w-full"
              defaultValue={servicio.icono || "✅"}
              aria-describedby="servicio-icono-ayuda"
            />
          </Field>
          <label htmlFor="servicio-es-pack" className="flex min-h-10 cursor-pointer items-center gap-2 text-[14px] text-gs-paper">
            <input
              id="servicio-es-pack"
              name="es_pack"
              type="checkbox"
              defaultChecked={servicio.es_pack}
              className="size-4 accent-gs-amber"
            />
            Es un pack destacado
          </label>
        </div>

        {error && <Notice title="No se pudo guardar">{error}</Notice>}

        <FormActions>
          <button type="submit" disabled={isPending} className={buttonClass("primary")}>
            {isPending ? "Guardando..." : "Guardar servicio"}
          </button>
        </FormActions>
      </form>
    </Panel>
  );
}
