"use client";

import { useState, useTransition } from "react";
import { ClienteNota, addClienteNota, deleteClienteNota, updateClienteNota } from "@/app/actions/clientes";
import { MessageSquare, Trash2, Edit2, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface ClienteNotasProps {
  clienteId: string;
  initialNotas: ClienteNota[];
}

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
      } catch (error) {
        toast.error("Error al añadir la nota");
      }
    });
  };

  const handleDeleteNota = (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta nota?")) return;

    startTransition(async () => {
      try {
        await deleteClienteNota(id);
        setNotas(notas.filter(n => n.id !== id));
        toast.success("Nota eliminada");
      } catch (error) {
        toast.error("Error al eliminar la nota");
      }
    });
  };

  const handleUpdateNota = (id: string) => {
    if (!editValue.trim()) return;

    startTransition(async () => {
      try {
        const updated = await updateClienteNota(id, editValue);
        setNotas(notas.map(n => n.id === id ? updated : n));
        setEditingId(null);
        toast.success("Nota actualizada");
      } catch (error) {
        toast.error("Error al actualizar la nota");
      }
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 bg-card-bg p-6 rounded-xl border border-card-border shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Notas Internas
        </h3>
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
          {notas.length} notas
        </span>
      </div>

      {/* Editor de nueva nota */}
      <div className="space-y-3">
        <textarea 
          value={newNota}
          onChange={(e) => setNewNota(e.target.value)}
          placeholder="Escribir una nota interna sobre el cliente..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors text-white min-h-[100px] resize-none"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <button 
            onClick={handleAddNota}
            disabled={isPending || !newNota.trim()}
            className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Añadir Nota
          </button>
        </div>
      </div>

      {/* Listado de notas */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {notas.length > 0 ? (
          notas.map(nota => (
            <div 
              key={nota.id} 
              className="group bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2 hover:border-white/10 transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted uppercase tracking-tighter italic">
                  {formatDate(nota.created_at)}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === nota.id ? (
                    <>
                      <button onClick={() => handleUpdateNota(nota.id)} className="p-1 text-green-400 hover:bg-green-400/10 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(nota.id); setEditValue(nota.nota); }} className="p-1 text-muted hover:text-white hover:bg-white/10 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteNota(nota.id)} className="p-1 text-muted hover:text-red-400 hover:bg-red-400/10 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === nota.id ? (
                <textarea 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-black/40 border border-accent/30 rounded-lg px-3 py-2 text-sm text-white min-h-[60px] focus:outline-none"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                  {nota.nota}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-muted italic">No hay notas registradas para este cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
