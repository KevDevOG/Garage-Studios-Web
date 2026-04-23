"use client";

import { useState, useTransition } from "react";
import { createServiceAction } from "@/app/actions/servicios";
import Link from "next/link";

export default function NuevoServicioPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createServiceAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 border-b border-card-border pb-4">
        <Link
          href="/admin/servicios"
          className="text-sm font-medium text-muted hover:text-white"
        >
          &larr; Volver a Servicios
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Nuevo Servicio</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <input
            name="nombre"
            type="text"
            required
            className="w-full"
            placeholder="Ej: Grabación de Voces"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            required
            rows={3}
            className="w-full"
            placeholder="Detalles del servicio..."
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
              required
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Categoría *</label>
            <select name="categoria" required className="w-full border-card-border bg-card-bg rounded-md p-2">
              <option value="">Seleccionar...</option>
              <option value="Sonido">Sonido</option>
              <option value="Fotografía y vídeo">Fotografía y Vídeo</option>
              <option value="Diseño">Diseño</option>
              <option value="Packs">Packs</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subcategoría</label>
            <select name="subcategoria" className="w-full border-card-border bg-card-bg rounded-md p-2">
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
            <input name="icono" type="text" className="w-full" placeholder="Ej: 🎙️" defaultValue="✅" />
          </div>
          <div className="flex items-center h-10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="es_pack" type="checkbox" className="w-4 h-4 accent-primary" />
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
          {isPending ? "Guardando..." : "Crear Servicio"}
        </button>
      </form>
    </section>
  );
}
