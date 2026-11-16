"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { updateReservation, deleteReservation } from "@/app/actions/calendario";
import { markWhatsappAsSent } from "@/app/actions/admin";
import type { ReservationRow, ReservationBlock } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ReservationBlockManager from "@/components/admin/ReservationBlockManager";
import FormAlert from "@/components/ui/FormAlert";
import { formatTime } from "@/lib/schedule";
import { formatDateTimeEs, formatIsoDateEs } from "@/lib/dates";
import { RESERVATION_STATES, type PaymentState } from "@/lib/reservation-states";
import { RESERVA_STATUS } from "@/lib/status-colors";

type EmailStatus = "enviado" | "error" | "pendiente";

function EmailStatusBadge({ label, status, errorText }: { label: string; status: EmailStatus; errorText?: string | null }) {
  const styles: Record<EmailStatus, string> = {
    enviado: "bg-green-500/10 text-green-400",
    error: "bg-red-500/10 text-red-400",
    pendiente: "bg-white/5 text-muted",
  };
  const dots: Record<EmailStatus, string> = {
    enviado: "bg-green-500",
    error: "bg-red-500",
    pendiente: "bg-muted",
  };
  const text: Record<EmailStatus, string> = { enviado: "Enviado", error: "Error", pendiente: "No enviado" };

  return (
    <div className="space-y-1">
      <span className="block text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} aria-hidden="true" />
        {text[status]}
      </span>
      {status === "error" && errorText && <p className="text-[11px] text-red-400/80">{errorText}</p>}
    </div>
  );
}

export default function EditarReservaForm({
  reservation,
  blocks,
  servicesList,
}: {
  reservation: ReservationRow;
  blocks: ReservationBlock[];
  servicesList: DBService[];
  /** Reservado para futuras integraciones con finanzas. */
  hasFinance?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [precioFinal, setPrecioFinal] = useState<number>(Number(reservation.precio) || 0);
  const [estadoPago, setEstadoPago] = useState<PaymentState>(reservation.estado_pago || "pendiente");
  const [importePagado, setImportePagado] = useState<number>(Number(reservation.importe_pagado) || 0);
  const [whatsappSent, setWhatsappSent] = useState<string | null>(reservation.confirmacion_whatsapp_enviada_at ?? null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateReservation(reservation.id, formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        toast.success("Reserva actualizada.");
        router.push("/admin/calendario");
      } catch {
        setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteReservation(reservation.id);
        if ("error" in result) {
          toast.error(result.error);
          setConfirmDelete(false);
          return;
        }
        toast.success("Reserva eliminada.");
        router.push("/admin/calendario");
      } catch {
        toast.error("No se pudo eliminar la reserva.");
        setConfirmDelete(false);
      }
    });
  };

  const handleMarkWhatsapp = () => {
    startTransition(async () => {
      const result = await markWhatsappAsSent(reservation.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setWhatsappSent(new Date().toISOString());
      toast.success("WhatsApp marcado como enviado.");
    });
  };

  const openWhatsapp = () => {
    let phone = reservation.telefono.replace(/\D/g, "");
    if (!phone.startsWith("34") && phone.length <= 9) phone = "34" + phone;

    const fechaStr = formatIsoDateEs(reservation.fecha_reserva, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const enlaceIcs = reservation.calendar_token ? `${baseUrl}/api/calendar/${reservation.calendar_token}` : "";

    const text = `Hola ${reservation.nombre} 👋,

Tu reserva en Garage Studios ha sido confirmada ✅.

🎵 Servicio: ${currentService?.nombre || "Sesión"}
${reservation.precio ? `💶 Precio: ${reservation.precio}€\n` : ""}📅 Fecha: ${fechaStr}
🕒 Hora: ${formatTime(reservation.hora_inicio)} - ${formatTime(reservation.hora_fin)}

📍 Dirección:
C. Drago, 35010, Las Palmas de Gran Canaria

${enlaceIcs ? `🗓️ Añadir al calendario:\n${enlaceIcs}\n\n` : ""}Si necesitas cambiar algo o tienes alguna duda antes de la sesión, puedes responder directamente a este mensaje.

Gracias por confiar en Garage Studios.
¡Nos vemos en el estudio! 🎶`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  // Comprobar si el servicio es pack
  const currentService = servicesList.find((s) => s.id === reservation.servicio_id);
  const isPack = currentService?.es_pack || false;
  const restante = Math.max(0, precioFinal - (importePagado || 0));

  const emailStatus = (sentAt: string | null | undefined, errorText: string | null | undefined, applies: boolean): EmailStatus =>
    sentAt ? "enviado" : applies && errorText ? "error" : "pendiente";

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        aria-busy={isPending}
        className="space-y-5 rounded-xl border border-card-border bg-card-bg p-6"
      >
        {/* Estado, origen y servicio */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="er-estado" className="mb-1 block text-sm font-medium">Estado</label>
            <select id="er-estado" name="estado" defaultValue={reservation.estado}>
              {RESERVATION_STATES.map((estado) => (
                <option key={estado} value={estado}>
                  {RESERVA_STATUS[estado]?.label ?? estado}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="er-origen" className="mb-1 block text-sm font-medium">Origen</label>
            <input
              id="er-origen"
              type="text"
              value={reservation.origen || "web"}
              readOnly
              className="cursor-not-allowed bg-white/5 text-muted"
            />
          </div>
          <div>
            <label htmlFor="er-servicio" className="mb-1 block text-sm font-medium">Servicio</label>
            <select id="er-servicio" name="servicio_id" defaultValue={reservation.servicio_id}>
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
            <label htmlFor="er-nombre" className="mb-1 block text-sm font-medium">
              Nombre <span className="text-accent" aria-hidden="true">*</span>
            </label>
            <input id="er-nombre" name="nombre" type="text" required minLength={2} maxLength={120} defaultValue={reservation.nombre} />
          </div>
          <div>
            <label htmlFor="er-email" className="mb-1 block text-sm font-medium">
              Email <span className="text-accent" aria-hidden="true">*</span>
            </label>
            <input id="er-email" name="email" type="email" required defaultValue={reservation.email} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="er-telefono" className="mb-1 block text-sm font-medium">
              Teléfono <span className="text-accent" aria-hidden="true">*</span>
            </label>
            <input id="er-telefono" name="telefono" type="tel" inputMode="tel" required defaultValue={reservation.telefono} />
          </div>
          <div>
            <label htmlFor="er-precio" className="mb-1 block text-sm font-medium">
              Precio final (€) <span className="text-accent" aria-hidden="true">*</span>
            </label>
            <input
              id="er-precio"
              name="precio"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={precioFinal}
              onChange={(e) => setPrecioFinal(Number(e.target.value))}
              className="border-accent/30 focus:border-accent"
              aria-describedby="er-precio-hint"
            />
            <p id="er-precio-hint" className="mt-1 text-xs italic text-muted">
              Precio base del servicio: {currentService?.precio ?? "--"} €
            </p>
          </div>
        </div>

        {/* Pagos */}
        <fieldset className="space-y-4 rounded-xl border border-white/5 bg-white/5 p-4">
          <legend className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-widest text-white/90">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Gestión de cobro
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="er-estado-pago" className="mb-1 block text-sm font-medium">Estado del pago</label>
              <select
                id="er-estado-pago"
                name="estado_pago"
                value={estadoPago}
                onChange={(e) => {
                  const val = e.target.value as PaymentState;
                  setEstadoPago(val);
                  if (val === "pagado") setImportePagado(precioFinal);
                  if (val === "pendiente") setImportePagado(0);
                }}
                className={`font-bold ${
                  estadoPago === "pagado" ? "text-green-400" : estadoPago === "parcial" ? "text-blue-400" : "text-amber-400"
                }`}
              >
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Pago parcial (señal)</option>
                <option value="pagado">Pagado total</option>
              </select>
            </div>
            <div>
              <label htmlFor="er-importe" className="mb-1 block text-sm font-medium">Importe pagado (€)</label>
              <input
                id="er-importe"
                name="importe_pagado"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={importePagado}
                onChange={(e) => setImportePagado(Number(e.target.value))}
                className="font-mono font-bold text-green-400"
                aria-describedby="er-importe-hint"
              />
              {precioFinal > 0 && (
                <p id="er-importe-hint" className="mt-1 text-xs font-bold uppercase tracking-tight text-muted">
                  Restante: <span className="text-white">{restante.toFixed(2)} €</span>
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Fecha y hora */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="er-fecha" className="mb-1 block text-sm font-medium">
              Fecha <span className="text-accent" aria-hidden="true">*</span>
            </label>
            <input id="er-fecha" name="fecha_reserva" type="date" required defaultValue={reservation.fecha_reserva} />
          </div>
          <div>
            <label htmlFor="er-hora" className="mb-1 block text-sm font-medium">Hora inicio</label>
            <input
              id="er-hora"
              name="hora_inicio"
              type="time"
              step="1800"
              defaultValue={reservation.hora_inicio?.slice(0, 5) || ""}
            />
          </div>
          <div>
            <label htmlFor="er-duracion" className="mb-1 block text-sm font-medium">Duración (min)</label>
            <input
              id="er-duracion"
              name="duracion_minutos"
              type="number"
              inputMode="numeric"
              min="30"
              max="1440"
              step="30"
              defaultValue={reservation.duracion_minutos || 60}
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="er-observaciones" className="mb-1 block text-sm font-medium">Observaciones del cliente</label>
          <textarea id="er-observaciones" name="observaciones" rows={2} maxLength={1000} defaultValue={reservation.observaciones || ""} />
        </div>

        <div>
          <label htmlFor="er-notas" className="mb-1 block text-sm font-medium">Notas internas (solo admin)</label>
          <textarea
            id="er-notas"
            name="notas_admin"
            rows={2}
            maxLength={2000}
            defaultValue={reservation.notas_admin || ""}
            placeholder="Notas privadas sobre esta reserva..."
          />
        </div>

        <FormAlert message={error} />

        {/* Botones */}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href="/admin/calendario"
            className="inline-flex items-center rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white"
          >
            Volver
          </Link>
          {confirmDelete ? (
            <div className="flex items-center gap-2" role="group" aria-label="Confirmar eliminación">
              <span className="text-xs font-bold text-red-300">¿Eliminar la reserva?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-black uppercase text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase text-muted transition-colors hover:text-white"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
        </div>
      </form>

      {/* Bloques (solo si es pack) */}
      {isPack && <ReservationBlockManager reservaId={reservation.id} blocks={blocks} />}

      {/* Comunicaciones */}
      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6" aria-labelledby="er-com-title">
        <h2 id="er-com-title" className="border-b border-white/5 pb-2 text-sm font-black uppercase tracking-widest text-white">
          Comunicaciones
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <EmailStatusBadge
            label="Email confirmación"
            status={emailStatus(reservation.confirmacion_email_enviada_at, reservation.confirmacion_error, true)}
            errorText={reservation.confirmacion_error}
          />
          <EmailStatusBadge
            label="Email cancelación"
            status={emailStatus(reservation.cancelacion_email_enviada_at, reservation.email_estado_error, reservation.estado === "cancelada")}
            errorText={reservation.email_estado_error}
          />
          <EmailStatusBadge
            label="Email completada"
            status={emailStatus(reservation.completada_email_enviada_at, reservation.email_estado_error, reservation.estado === "completada")}
            errorText={reservation.email_estado_error}
          />

          {/* WhatsApp */}
          <div className="space-y-3 border-t border-white/5 pt-2 sm:col-span-2 md:col-span-3">
            <div className="space-y-1">
              <span className="block text-[11px] font-bold uppercase tracking-widest text-muted">WhatsApp manual</span>
              {whatsappSent ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                  Enviado el {formatDateTimeEs(whatsappSent, { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
                  Pendiente
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={openWhatsapp}
                className="rounded-lg bg-[#25D366]/10 px-3 py-2 text-xs font-bold text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-black"
              >
                Abrir WhatsApp
              </button>

              {reservation.calendar_token && (
                <a
                  href={`/api/calendar/${reservation.calendar_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  Añadir al calendario (.ics)
                </a>
              )}

              {!whatsappSent && (
                <button
                  type="button"
                  onClick={handleMarkWhatsapp}
                  disabled={isPending}
                  className="rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Marcar enviado
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info de auditoría */}
      <div className="rounded-xl border border-card-border bg-card-bg p-4 text-xs text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>Creada: {formatDateTimeEs(reservation.created_at)}</span>
          {reservation.updated_at && <span>Actualizada: {formatDateTimeEs(reservation.updated_at)}</span>}
          <span>
            Horario: {formatTime(reservation.hora_inicio)} - {formatTime(reservation.hora_fin)}
          </span>
          <span className="font-mono">ID: {reservation.id}</span>
        </div>
      </div>
    </div>
  );
}
