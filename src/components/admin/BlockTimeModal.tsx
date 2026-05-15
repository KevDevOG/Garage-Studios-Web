"use client";

import { useState, useTransition } from "react";
import { X, Clock, Calendar, MessageSquare, ShieldAlert } from "lucide-react";
import { createBloqueo } from "@/app/actions/bloqueos";

interface BlockTimeModalProps {
  onClose: () => void;
  initialDate?: string;
}

export default function BlockTimeModal({ onClose, initialDate }: BlockTimeModalProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    fecha: initialDate || new Date().toISOString().split('T')[0],
    hora_inicio: "10:00",
    hora_fin: "14:00",
    motivo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createBloqueo(formData);
        onClose();
      } catch (error) {
        console.error("Error creating block:", error);
        alert("Error al crear el bloqueo horario.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-2 text-accent border border-accent/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Bloquear Horario</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Fecha del Bloqueo
            </label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-card-border bg-black/40 p-3 text-sm text-white outline-none focus:border-accent/40 transition-colors"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Clock className="h-3 w-3" /> Inicio
              </label>
              <input
                type="time"
                required
                className="w-full rounded-xl border border-card-border bg-black/40 p-3 text-sm text-white outline-none focus:border-accent/40 transition-colors"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                <Clock className="h-3 w-3" /> Fin
              </label>
              <input
                type="time"
                required
                className="w-full rounded-xl border border-card-border bg-black/40 p-3 text-sm text-white outline-none focus:border-accent/40 transition-colors"
                value={formData.hora_fin}
                onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> Motivo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Mantenimiento, Sesión privada, Descanso..."
              className="w-full rounded-xl border border-card-border bg-black/40 p-3 text-sm text-white outline-none focus:border-accent/40 transition-colors"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-card-border bg-transparent py-3 text-sm font-bold text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-black uppercase tracking-widest text-black hover:bg-accent-hover transition-all disabled:opacity-50 disabled:scale-95"
            >
              {isPending ? "Bloqueando..." : "Confirmar Bloqueo"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-[10px] text-muted text-center italic">
          * Este bloqueo impedirá que los clientes reserven en esta franja desde la web pública.
        </p>
      </div>
    </div>
  );
}
