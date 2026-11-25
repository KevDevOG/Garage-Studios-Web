"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { markWhatsappAsSent } from "@/app/actions/admin";
import type { ReservationRow } from "@/app/actions/calendario";
import { formatDateTimeEs, formatIsoDateEs } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";
import { Badge, Panel, buttonClass, type Tone } from "../ui";

type EmailStatus = "enviado" | "error" | "pendiente";

const EMAIL_TONE: Record<EmailStatus, Tone> = { enviado: "ok", error: "bad", pendiente: "neutral" };
const EMAIL_TEXT: Record<EmailStatus, string> = { enviado: "Enviado", error: "Error", pendiente: "No enviado" };

function emailStatus(
  sentAt: string | null | undefined,
  errorText: string | null | undefined,
  applies: boolean,
): EmailStatus {
  return sentAt ? "enviado" : applies && errorText ? "error" : "pendiente";
}

function EmailRow({ label, status, errorText }: { label: string; status: EmailStatus; errorText?: string | null }) {
  return (
    <div className="py-2.5 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-[13px] text-gs-soft">{label}</dt>
        <dd>
          <Badge tone={EMAIL_TONE[status]} plain>
            {EMAIL_TEXT[status]}
          </Badge>
        </dd>
      </div>
      {status === "error" && errorText && <p className="mt-1 text-[12px] leading-snug text-gs-bad">{errorText}</p>}
    </div>
  );
}

/** Estado de los correos automáticos y envío manual por WhatsApp. */
export default function ComunicacionesReserva({
  reservation,
  servicioNombre,
}: {
  reservation: ReservationRow;
  servicioNombre?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [whatsappSent, setWhatsappSent] = useState<string | null>(reservation.confirmacion_whatsapp_enviada_at ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkWhatsapp = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await markWhatsappAsSent(reservation.id);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        setWhatsappSent(new Date().toISOString());
        toast.success("WhatsApp marcado como enviado.");
      } catch {
        setError("No se pudo marcar como enviado. Inténtalo de nuevo.");
      }
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

🎵 Servicio: ${servicioNombre || "Sesión"}
${reservation.precio ? `💶 Precio: ${reservation.precio}€\n` : ""}📅 Fecha: ${fechaStr}
🕒 Hora: ${formatTime(reservation.hora_inicio)} - ${formatTime(reservation.hora_fin)}

📍 Dirección:
C. Drago, 35010, Las Palmas de Gran Canaria

${enlaceIcs ? `🗓️ Añadir al calendario:\n${enlaceIcs}\n\n` : ""}Si necesitas cambiar algo o tienes alguna duda antes de la sesión, puedes responder directamente a este mensaje.

Gracias por confiar en Garage Studios.
¡Nos vemos en el estudio! 🎶`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Panel title="Avisos al cliente">
      <dl className="divide-y divide-gs-line">
        <EmailRow
          label="Correo de confirmación"
          status={emailStatus(reservation.confirmacion_email_enviada_at, reservation.confirmacion_error, true)}
          errorText={reservation.confirmacion_error}
        />
        <EmailRow
          label="Correo de cancelación"
          status={emailStatus(
            reservation.cancelacion_email_enviada_at,
            reservation.email_estado_error,
            reservation.estado === "cancelada",
          )}
          errorText={reservation.email_estado_error}
        />
        <EmailRow
          label="Correo de sesión completada"
          status={emailStatus(
            reservation.completada_email_enviada_at,
            reservation.email_estado_error,
            reservation.estado === "completada",
          )}
          errorText={reservation.email_estado_error}
        />
        <div className="py-2.5 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[13px] text-gs-soft">WhatsApp manual</dt>
            <dd>
              {whatsappSent ? (
                <Badge tone="ok" plain>
                  Enviado el{" "}
                  {formatDateTimeEs(whatsappSent, { day: "2-digit", month: "2-digit", year: "numeric" })}
                </Badge>
              ) : (
                <Badge tone="amber" plain>
                  Pendiente
                </Badge>
              )}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-gs-line pt-3">
        <button type="button" onClick={openWhatsapp} className={buttonClass("secondary", "sm")}>
          <MessageCircle aria-hidden />
          Abrir WhatsApp
        </button>

        {!whatsappSent && (
          <button type="button" onClick={handleMarkWhatsapp} disabled={isPending} className={buttonClass("ghost", "sm")}>
            <Check aria-hidden />
            {isPending ? "Guardando…" : "Marcar enviado"}
          </button>
        )}

        {reservation.calendar_token && (
          <a
            href={`/api/calendar/${reservation.calendar_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("ghost", "sm")}
          >
            <CalendarPlus aria-hidden />
            Calendario (.ics)
          </a>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[12px] leading-snug text-gs-bad">
          {error}
        </p>
      )}
    </Panel>
  );
}
