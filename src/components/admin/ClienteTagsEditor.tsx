"use client";

import { useState, useTransition } from "react";
import { updateClienteEtiquetas } from "@/app/actions/clientes";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Panel, buttonClass } from "./ui";

interface ClienteTagsEditorProps {
  clienteId: string;
  initialTags: string[];
}

const SUGGESTED_TAGS = [
  "Frecuente", "Nuevo", "VIP", "Pendiente de pago",
  "Artistas", "Fotografía", "Videoclip", "Producción",
  "Cliente potencial", "Empresa",
];

export default function ClienteTagsEditor({ clienteId, initialTags }: ClienteTagsEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;

    const updated = [...tags, trimmed];
    saveTags(updated);
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tags.filter((t) => t !== tag);
    saveTags(updated);
  };

  const saveTags = (updatedTags: string[]) => {
    const previous = tags;
    setTags(updatedTags);
    startTransition(async () => {
      try {
        await updateClienteEtiquetas(clienteId, updatedTags);
        toast.success("Etiquetas actualizadas");
      } catch {
        // Revertir la actualización optimista si el servidor falla
        setTags(previous);
        toast.error("Error al guardar etiquetas");
      }
    });
  };

  const suggestions = SUGGESTED_TAGS.filter((t) => !tags.includes(t));

  return (
    <Panel title="Etiquetas" meta={tags.length > 0 ? tags.length : undefined}>
      <div className="space-y-3">
        <ul aria-label="Etiquetas del cliente" className="flex min-h-8 flex-wrap items-center gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-md border border-gs-line-strong bg-gs-raised py-0.5 pl-2 text-[13px] text-gs-paper"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isPending}
                  aria-label={`Quitar etiqueta ${tag}`}
                  className="inline-flex size-10 items-center justify-center rounded-md text-gs-soft hover:text-gs-paper disabled:opacity-50 sm:size-7"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))
          ) : (
            <li className="text-[13px] text-gs-faint">Sin etiquetas todavía</li>
          )}
        </ul>

        <div>
          <label htmlFor="cliente-nueva-etiqueta" className="sr-only">Nueva etiqueta</label>
          <div className="flex gap-2">
            <input
              id="cliente-nueva-etiqueta"
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(newTag);
                  setNewTag("");
                }
              }}
              placeholder="Añadir etiqueta"
              className="min-w-0 flex-1"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => {
                handleAddTag(newTag);
                setNewTag("");
              }}
              disabled={isPending || !newTag.trim()}
              aria-label="Añadir etiqueta"
              className={buttonClass("secondary", "md", "w-11 px-0 sm:w-10")}
            >
              <Plus aria-hidden />
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-1.5 text-[12px] text-gs-faint">Sugerencias</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  disabled={isPending}
                  className="inline-flex h-10 items-center rounded-md border border-gs-line px-2.5 text-[13px] text-gs-soft hover:border-gs-line-strong hover:text-gs-paper disabled:opacity-50 sm:h-8"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
