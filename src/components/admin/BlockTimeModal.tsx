"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createBloqueo } from "@/app/actions/bloqueos";
import { todayInStudio } from "@/lib/dates";
import { Field, buttonClass } from "./ui";

interface BlockTimeModalProps {
  onClose: () => void;
  initialDate?: string;
}

/**
 * Bloquea una franja de la agenda. Usa <dialog> nativo: el foco queda
 * atrapado, Escape cierra y el fondo deja de ser interactivo.
 */
export default function BlockTimeModal({ onClose, initialDate }: BlockTimeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fecha: initialDate || todayInStudio(),
    hora_inicio: "16:00",
    hora_fin: "18:00",
    motivo: "",
  });
  const uid = useId();
  const ids = {
    title: `${uid}-titulo`,
    fecha: `${uid}-fecha`,
    inicio: `${uid}-inicio`,
    fin: `${uid}-fin`,
    motivo: `${uid}-motivo`,
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createBloqueo(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Horas bloqueadas.");
        onClose();
      } catch (err) {
        console.error("Error creating block:", err);
        setError("No se pudo crear el bloqueo. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={ids.title}
      onClose={onClose}
      onClick={(e) => {
        // Pulsar fuera del cuadro (sobre el fondo) cierra.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-lg border border-gs-line-strong bg-gs-surface p-0 text-gs-paper backdrop:bg-black/70"
    >
      <form onSubmit={handleSubmit} className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={ids.title} className="gs-display text-[18px] font-semibold text-gs-paper">
              Bloquear horas
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-gs-soft">
              Nadie podrá reservar esa franja desde la web.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar"
            className={buttonClass("ghost", "sm", "w-10 px-0 sm:w-8")}
          >
            <X aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Fecha" htmlFor={ids.fecha} required>
            <input
              id={ids.fecha}
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde" htmlFor={ids.inicio} required>
              <input
                id={ids.inicio}
                type="time"
                required
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              />
            </Field>
            <Field label="Hasta" htmlFor={ids.fin} required>
              <input
                id={ids.fin}
                type="time"
                required
                value={formData.hora_fin}
                onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Motivo" htmlFor={ids.motivo} hint="Opcional. Solo se ve en el panel.">
            <input
              id={ids.motivo}
              type="text"
              maxLength={200}
              placeholder="Mantenimiento, sesión privada, descanso"
              aria-describedby={`${ids.motivo}-ayuda`}
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            />
          </Field>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-gs-bad">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className={buttonClass("ghost")}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={buttonClass("primary")}>
            {isPending ? "Bloqueando…" : "Bloquear horas"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
