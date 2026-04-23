"use client";

import { useState, useTransition } from "react";
import { updateServiceAction } from "@/app/actions/servicios";

export default function EditarServicioForm({ servicio }: { servicio: any }) {
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input
          name="nombre"
          type="text"
          defaultValue={servicio.nombre}
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea
          name="descripcion"
          defaultValue={servicio.descripcion}
          required
          rows={3}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Precio (€)</label>
          <input
            name="precio"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={servicio.precio}
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Duración (minutos)
          </label>
          <input
            name="duracion_minutos"
            type="number"
            min="1"
            defaultValue={servicio.duracion_minutos}
            required
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría *</label>
          <select name="categoria" required defaultValue={servicio.categoria} className="w-full border-card-border bg-card-bg rounded-md p-2">
            <option value="">Seleccionar...</option>
            <option value="Sonido">Sonido</option>
            <option value="Fotografía y vídeo">Fotografía y Vídeo</option>
            <option value="Diseño">Diseño</option>
            <option value="Packs">Packs</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subcategoría</label>
          <select name="subcategoria" defaultValue={servicio.subcategoria || ""} className="w-full border-card-border bg-card-bg rounded-md p-2">
            <option value="">Ninguna</option>
            <option value="Planes GST">Planes GST</option>
            <option value="Packs Sonido">Packs Sonido</option>
            <option value="Garage Visuals">Garage Visuals</option>
            <option value="Pack Diseño">Pack Diseño</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="mb-1 block text-sm font-medium">Icono (Emoji)</label>
          <input name="icono" type="text" className="w-full" placeholder="Ej: 🎙️" defaultValue={servicio.icono || "✅"} />
        </div>
        <div className="flex items-center h-10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="es_pack" type="checkbox" defaultChecked={servicio.es_pack} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium">Es un Pack Destacado</span>
          </label>
        </div>
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
