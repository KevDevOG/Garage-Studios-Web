"use client";

import { useState, useTransition } from "react";
import { ClienteNota, addClienteNota, deleteClienteNota, updateClienteNota } from "@/app/actions/clientes";
import { Trash2, Pencil, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Panel, buttonClass, cx } from "./ui";

interface ClienteNotasProps {
  clienteId: string;
  initialNotas: ClienteNota[];
}

const ICON_BTN =
  "inline-flex size-10 items-center justify-center rounded-md text-gs-soft hover:bg-gs-raised hover:text-gs-paper disabled:opacity-50 sm:size-8";

export default function ClienteNotas({ clienteId, initialNotas }: ClienteNotasProps) {
  const [notas, setNotas] = useState<ClienteNota[]>(initialNotas || []);
  const [newNota, setNewNota] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddNota = () => {
    if (!newNota.trim()) return;

    startTransition(async () => {
      try {
        const added = await addClienteNota(clienteId, newNota);
        setNotas([added, ...notas]);
        setNewNota("");
        toast.success("Nota añadida");
      } catch {
        toast.error("Error al añadir la nota");
      }
    });
  };

  const handleDeleteNota = (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta nota?")) return;

    startTransition(async () => {
      try {
        await deleteClienteNota(id);
        setNotas(notas.filter((n) => n.id !== id));
        toast.success("Nota eliminada");
      } catch {
        toast.error("Error al eliminar la nota");
      }
    });
  };

  const handleUpdateNota = (id: string) => {
    if (!editValue.trim()) return;

    startTransition(async () => {
      try {
        const updated = await updateClienteNota(id, editValue);
        setNotas(notas.map((n) => (n.id === id ? updated : n)));
        setEditingId(null);
        toast.success("Nota actualizada");
      } catch {
        toast.error("Error al actualizar la nota");
      }
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Panel title="Notas internas" meta={notas.length}>
      <div className="space-y-3">
        <div>
          <label htmlFor="cliente-nueva-nota" className="sr-only">Nueva nota interna</label>
          <textarea
            id="cliente-nueva-nota"
            value={newNota}
            onChange={(e) => setNewNota(e.target.value)}
            placeholder="Escribe una nota interna sobre el cliente"
            rows={3}
            className="w-full resize-y"
            disabled={isPending}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddNota}
              disabled={isPending || !newNota.trim()}
              className={buttonClass("secondary", "md")}
            >
              <Plus aria-hidden /> Añadir nota
            </button>
          </div>
        </div>

        {notas.length > 0 ? (
          <ul className="max-h-[420px] divide-y divide-gs-line overflow-y-auto border-t border-gs-line">
            {notas.map((nota) => (
              <li key={nota.id} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-gs-faint">{formatDate(nota.created_at)}</span>
                  <div className="flex shrink-0 gap-0.5">
                    {editingId === nota.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateNota(nota.id)}
                          disabled={isPending}
                          aria-label="Guardar nota"
                          className={cx(ICON_BTN, "text-gs-ok hover:text-gs-ok")}
                        >
                          <Check aria-hidden className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancelar edición"
                          className={ICON_BTN}
                        >
                          <X aria-hidden className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(nota.id);
                            setEditValue(nota.nota);
                          }}
                          aria-label="Editar nota"
                          className={ICON_BTN}
                        >
                          <Pencil aria-hidden className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNota(nota.id)}
                          disabled={isPending}
                          aria-label="Eliminar nota"
                          className={cx(ICON_BTN, "hover:text-gs-bad")}
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === nota.id ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    aria-label="Texto de la nota"
                    rows={3}
                    className="mt-1 w-full resize-y"
                    autoFocus
                  />
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-gs-paper">
                    {nota.nota}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="border-t border-gs-line px-0 pb-0 pt-3"
            title="Sin notas todavía"
            hint="Anota acuerdos, preferencias o cualquier detalle útil para la próxima sesión."
          />
        )}
      </div>
    </Panel>
  );
}
