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
  hasFinance,
}: {
  reservation: ReservationRow;
  blocks: ReservationBlock[];
  servicesList: DBService[];
  hasFinance?: boolean;
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <label className="mb-1 block text-sm font-medium">Precio Final (€) *</label>
            <input
              name="precio"
              type="number"
              step="0.01"
              required
              defaultValue={reservation.precio || 0}
              className="w-full border-accent/30 focus:border-accent"
            />
            <p className="mt-1 text-[10px] text-muted italic">Precio base del servicio: {currentService?.precio || "--"}€</p>
          </div>
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

      {/* Comunicaciones */}
      <div className="rounded-xl border border-card-border bg-card-bg p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">
          Comunicaciones
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email Status */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold block">
              Email Automático
            </span>
            {reservation.confirmacion_email_enviada_at ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Enviado
              </span>
            ) : reservation.confirmacion_error ? (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  Error
                </span>
                <p className="text-[10px] text-red-400/80">{reservation.confirmacion_error}</p>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-muted"></span>
                No enviado
              </span>
            )}
          </div>

          {/* WhatsApp Status & Actions */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold block">
                WhatsApp Manual
              </span>
              {reservation.confirmacion_whatsapp_enviada_at ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Enviado el {new Date(reservation.confirmacion_whatsapp_enviada_at).toLocaleDateString("es-ES")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted"></span>
                  Pendiente
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  let phone = reservation.telefono.replace(/\D/g, "");
                  if (!phone.startsWith("34") && phone.length <= 9) {
                    phone = "34" + phone;
                  }
                  
                  const fechaStr = new Date(reservation.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  });
                  
                  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                  const enlaceIcs = reservation.calendar_token ? `${baseUrl}/api/calendar/${reservation.calendar_token}` : '';
                  
                  const text = `Hola ${reservation.nombre} 👋,

Tu reserva en Garage Studios ha sido confirmada ✅.

🎵 Servicio: ${currentService?.nombre || 'Sesión'}
${reservation.precio ? `💶 Precio: ${reservation.precio}€\n` : ''}📅 Fecha: ${fechaStr}
🕒 Hora: ${reservation.hora_inicio?.slice(0,5)} - ${reservation.hora_fin?.slice(0,5)}

📍 Dirección:
C. Drago, 35010, Las Palmas de Gran Canaria

${enlaceIcs ? `🗓️ Añadir al calendario:\n${enlaceIcs}\n\n` : ''}Si necesitas cambiar algo o tienes alguna duda antes de la sesión, puedes responder directamente a este mensaje.

Gracias por confiar en Garage Studios.
¡Nos vemos en el estudio! 🎶`;

                  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, "_blank");
                }}
                className="rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-bold text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-black"
              >
                Abrir WhatsApp
              </button>
              
              {reservation.calendar_token && (
                <a
                  href={`/api/calendar/${reservation.calendar_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-white/5 hover:text-white inline-flex items-center"
                >
                  Añadir al calendario
                </a>
              )}
              
              {!reservation.confirmacion_whatsapp_enviada_at && (
                <button
                  type="button"
                  onClick={async () => {
                    startTransition(async () => {
                      const { markWhatsappAsSent } = await import("@/app/actions/admin");
                      await markWhatsappAsSent(reservation.id);
                    });
                  }}
                  disabled={isPending}
                  className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Marcar Enviado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finanzas */}
      {(reservation.estado === "confirmada" || reservation.estado === "completada") && (
        <div className="rounded-xl border border-card-border bg-card-bg p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">
            Finanzas
          </h3>
          <div className="flex items-center justify-between">
            {hasFinance ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Ingreso Registrado
              </span>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">Aún no hay ingresos registrados para esta reserva.</p>
                <Link 
                  href={`/admin/finanzas/nuevo?reserva_id=${reservation.id}&cliente_id=${reservation.cliente_id || ''}&servicio_id=${reservation.servicio_id || ''}&concepto=${encodeURIComponent(`Reserva - ${reservation.nombre}`)}&importe=${reservation.precio || currentService?.precio || ''}&tipo=ingreso&categoria=${encodeURIComponent(currentService?.nombre || 'Otros')}&fecha=${reservation.fecha_reserva}`}
                  className="rounded-lg bg-accent/10 px-4 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/20 w-max"
                >
                  + Añadir a Finanzas
                </Link>
              </div>
            )}
          </div>
        </div>
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
