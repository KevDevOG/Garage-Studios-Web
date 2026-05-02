"use client";

import { useState, useTransition } from "react";
import {
  addReservationBlock,
  deleteReservationBlock,
  type ReservationBlock,
} from "@/app/actions/calendario";

export default function ReservationBlockManager({
  reservaId,
  blocks: initialBlocks,
}: {
  reservaId: string;
  blocks: ReservationBlock[];
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("reserva_id", reservaId);

    startTransition(async () => {
      const result = await addReservationBlock(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        // Refresh will happen via revalidation
        window.location.reload();
      }
    });
  };

  const handleDelete = (blockId: string) => {
    if (!confirm("¿Eliminar este bloque?")) return;
    startTransition(async () => {
      await deleteReservationBlock(blockId);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    });
  };

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Bloques / Sesiones del Pack
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          {showForm ? "Cancelar" : "+ Añadir Bloque"}
        </button>
      </div>

      {/* Lista de bloques existentes */}
      {blocks.length === 0 && !showForm && (
        <p className="py-4 text-center text-sm text-muted">
          Sin bloques. Añade sesiones para organizar este pack.
        </p>
      )}

      {blocks.length > 0 && (
        <div className="mb-4 space-y-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between rounded-lg border border-card-border p-3"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-semibold">{block.titulo}</div>
                <div className="text-xs text-muted">
                  {new Date(block.fecha + "T00:00:00").toLocaleDateString(
                    "es-ES",
                    { day: "numeric", month: "short" }
                  )}{" "}
                  · {block.hora_inicio?.slice(0, 5)} —{" "}
                  {block.hora_fin?.slice(0, 5)} · {block.duracion_minutos} min
                </div>
              </div>
              <button
                onClick={() => handleDelete(block.id)}
                disabled={isPending}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nuevo bloque */}
      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 border-t border-card-border pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium">
              Título *
            </label>
            <input
              name="titulo"
              type="text"
              required
              className="w-full"
              placeholder="Ej: Grabación de voces"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Fecha *</label>
              <input name="fecha" type="date" required className="w-full" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Hora inicio *
              </label>
              <input
                name="hora_inicio"
                type="time"
                required
                className="w-full"
                step="1800"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Duración (min) *
              </label>
              <input
                name="duracion_minutos"
                type="number"
                required
                min="30"
                step="30"
                defaultValue="60"
                className="w-full"
              />
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Añadir Bloque"}
          </button>
        </form>
      )}
    </div>
  );
}
