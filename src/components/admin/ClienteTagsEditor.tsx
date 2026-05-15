"use client";

import { useState, useTransition } from "react";
import { updateClienteEtiquetas } from "@/app/actions/clientes";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface ClienteTagsEditorProps {
  clienteId: string;
  initialTags: string[];
}

const SUGGESTED_TAGS = [
  "Frecuente", "Nuevo", "VIP", "Pendiente de pago", 
  "Artistas", "Fotografía", "Videoclip", "Producción", 
  "Cliente potencial", "Empresa"
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
    const updated = tags.filter(t => t !== tag);
    saveTags(updated);
  };

  const saveTags = (updatedTags: string[]) => {
    setTags(updatedTags);
    startTransition(async () => {
      try {
        await updateClienteEtiquetas(clienteId, updatedTags);
        toast.success("Etiquetas actualizadas");
      } catch (error) {
        toast.error("Error al guardar etiquetas");
      }
    });
  };

  return (
    <div className="space-y-4 bg-card-bg p-6 rounded-xl border border-card-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
          <TagIcon className="w-3 h-3" /> Etiquetas Internas
        </h3>
      </div>

      {/* Tags Actuales */}
      <div className="flex flex-wrap gap-2 min-h-[40px] items-center p-3 rounded-lg bg-white/5 border border-white/5">
        {tags.length > 0 ? (
          tags.map(tag => (
            <span 
              key={tag} 
              className="flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-fade-in"
            >
              {tag}
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-white transition-colors"
                disabled={isPending}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-muted italic">Sin etiquetas</span>
        )}
      </div>

      {/* Input para añadir */}
      <div className="flex gap-2">
        <input 
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newTag), setNewTag(""))}
          placeholder="Añadir etiqueta..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 transition-colors text-white"
          disabled={isPending}
        />
        <button 
          onClick={() => { handleAddTag(newTag); setNewTag(""); }}
          className="p-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
          disabled={isPending || !newTag.trim()}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Sugerencias */}
      <div className="pt-2">
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Sugerencias</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-muted hover:text-white transition-all uppercase"
              disabled={isPending}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
