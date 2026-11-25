"use client";

import { useId, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addReservationBlock,
  deleteReservationBlock,
  type ReservationBlock,
} from "@/app/actions/calendario";
import { formatIsoDateEs } from "@/lib/dates";
import { plural } from "@/lib/format";
import { EmptyState, Field, FormActions, Notice, Panel, buttonClass } from "./ui";

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("reserva_id", reservaId);

    startTransition(async () => {
      try {
        const result = await addReservationBlock(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setShowForm(false);
          // Refresh will happen via revalidation
          window.location.reload();
        }
      } catch {
        setError("No se pudo añadir la sesión. Inténtalo de nuevo.");
      }
    });
  };

  const handleDelete = (blockId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteReservationBlock(blockId);
        if (result && "error" in result && result.error) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        toast.success("Sesión eliminada.");
      } catch {
        setError("No se pudo eliminar la sesión. Inténtalo de nuevo.");
      } finally {
        setConfirmingId(null);
      }
    });
  };

  return (
    <Panel
      title="Sesiones del pack"
      meta={plural(blocks.length, "sesión", "sesiones")}
      action={
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setError(null);
          }}
          aria-expanded={showForm}
          className={buttonClass(showForm ? "ghost" : "secondary", "sm")}
        >
          {!showForm && <Plus aria-hidden />}
          {showForm ? "Cancelar" : "Añadir sesión"}
        </button>
      }
      flush
    >
      {blocks.length === 0 && !showForm && (
        <EmptyState title="Sin sesiones" hint="Añade las sesiones para organizar este pack." />
      )}

      {blocks.length > 0 && (
        <ul className="divide-y divide-gs-line">
          {blocks.map((block) => (
            <li key={block.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-gs-paper">{block.titulo}</p>
                <p className="mt-0.5 text-[13px] text-gs-soft">
                  {formatIsoDateEs(block.fecha, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                  {block.hora_inicio?.slice(0, 5)} a {block.hora_fin?.slice(0, 5)} ({block.duracion_minutos} min)
                </p>
              </div>

              {confirmingId === block.id ? (
                <span role="group" aria-label={`Confirmar eliminación de ${block.titulo}`} className="inline-flex items-center gap-1.5">
                  <span className="text-[13px] text-gs-soft">¿Eliminar?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(block.id)}
                    disabled={isPending}
                    className={buttonClass("danger", "sm")}
                  >
                    {isPending ? "Eliminando…" : "Sí, eliminar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={isPending}
                    className={buttonClass("ghost", "sm")}
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(block.id)}
                  disabled={isPending}
                  aria-label={`Eliminar sesión ${block.titulo}`}
                  title={`Eliminar sesión ${block.titulo}`}
                  className={buttonClass("ghost", "sm", "w-10 px-0 hover:text-gs-bad sm:w-8")}
                >
                  <Trash2 aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && !showForm && (
        <div className="p-4">
          <Notice tone="bad">{error}</Notice>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-4 border-t border-gs-line p-4 first:border-t-0">
          <Field label="Título" htmlFor={id("titulo")} required>
            <input
              id={id("titulo")}
              name="titulo"
              type="text"
              required
              maxLength={120}
              placeholder="Por ejemplo: grabación de voces"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Fecha" htmlFor={id("fecha")} required>
              <input id={id("fecha")} name="fecha" type="date" required />
            </Field>
            <Field label="Hora de inicio" htmlFor={id("hora")} required>
              <input id={id("hora")} name="hora_inicio" type="time" required step="1800" />
            </Field>
            <Field label="Duración (min)" htmlFor={id("duracion")} required>
              <input
                id={id("duracion")}
                name="duracion_minutos"
                type="number"
                inputMode="numeric"
                required
                min="30"
                step="30"
                defaultValue="60"
              />
            </Field>
          </div>
          {error && <Notice tone="bad">{error}</Notice>}
          <FormActions>
            <button type="submit" disabled={isPending} className={buttonClass("secondary")}>
              {isPending ? "Guardando…" : "Añadir sesión"}
            </button>
          </FormActions>
        </form>
      )}
    </Panel>
  );
}
