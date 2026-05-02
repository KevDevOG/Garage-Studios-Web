"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateReservation, deleteReservation } from "@/app/actions/calendario";
import type { ReservationRow, ReservationBlock } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ReservationBlockManager from "@/components/admin/ReservationBlockManager";

export default function EditarReservaForm({
  reservation,
  blocks,
  servicesList,
}: {
  reservation: ReservationRow;
  blocks: ReservationBlock[];
  servicesList: DBService[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateReservation(reservation.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/calendario");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Eliminar esta reserva? Se hará un borrado lógico.")) return;
    startTransition(async () => {
      await deleteReservation(reservation.id);
      router.push("/admin/calendario");
    });
  };

  // Comprobar si el servicio es pack
  const currentService = servicesList.find(
    (s) => s.id === reservation.servicio_id
  );
  const isPack = currentService?.es_pack || false;

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
      >
        {/* Estado y origen */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Estado</label>
            <select
              name="estado"
              defaultValue={reservation.estado}
              className="w-full"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="rechazada">Rechazada</option>
              <option value="completada">Completada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Origen</label>
            <input
              type="text"
              value={reservation.origen || "web"}
              readOnly
              className="w-full bg-white/5 text-muted cursor-not-allowed"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Servicio</label>
            <select
              name="servicio_id"
              defaultValue={reservation.servicio_id}
              className="w-full"
            >
              {servicesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={reservation.nombre}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={reservation.email}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono *</label>
          <input
            name="telefono"
            type="tel"
            required
            defaultValue={reservation.telefono}
            className="w-full"
          />
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha *</label>
            <input
              name="fecha_reserva"
              type="date"
              required
              defaultValue={reservation.fecha_reserva}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Hora inicio
            </label>
            <input
              name="hora_inicio"
              type="time"
              defaultValue={reservation.hora_inicio?.slice(0, 5) || ""}
              className="w-full"
              step="1800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Duración (min)
            </label>
            <input
              name="duracion_minutos"
              type="number"
              min="30"
              step="30"
              defaultValue={reservation.duracion_minutos || 60}
              className="w-full"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Observaciones del cliente
          </label>
          <textarea
            name="observaciones"
            rows={2}
            defaultValue={reservation.observaciones || ""}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Notas internas (solo admin)
          </label>
          <textarea
            name="notas_admin"
            rows={2}
            defaultValue={reservation.notas_admin || ""}
            className="w-full"
            placeholder="Notas privadas sobre esta reserva..."
          />
        </div>

        {/* calendar_event_id — TODO: Futuro Apple Calendar */}
        {reservation.calendar_event_id && (
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">
              Calendar Event ID
            </label>
            <input
              type="text"
              value={reservation.calendar_event_id}
              readOnly
              className="w-full bg-white/5 text-muted cursor-not-allowed text-xs"
            />
          </div>
        )}

        {error && (
          <p className="text-sm font-medium text-red-500">{error}</p>
        )}

        {/* Botones */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
          <Link
            href="/admin/calendario"
            className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white"
          >
            Volver
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </form>

      {/* Bloques (solo si es pack) */}
      {isPack && (
        <ReservationBlockManager
          reservaId={reservation.id}
          blocks={blocks}
        />
      )}

      {/* Info de auditoría */}
      <div className="rounded-xl border border-card-border bg-card-bg p-4 text-xs text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Creada:{" "}
            {new Date(reservation.created_at).toLocaleString("es-ES")}
          </span>
          {reservation.updated_at && (
            <span>
              Actualizada:{" "}
              {new Date(reservation.updated_at).toLocaleString("es-ES")}
            </span>
          )}
          <span>ID: {reservation.id}</span>
        </div>
      </div>
    </div>
  );
}
