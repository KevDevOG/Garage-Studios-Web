import { NextResponse } from "next/server";
import { createPublicClient, createServiceClient } from "@/lib/supabase/public";
import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limit";
import { isUuid } from "@/lib/reservation-rules";

interface CalendarReservation {
  nombre: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  servicio_nombre: string;
}

/**
 * Busca la reserva por su token de calendario.
 *
 * El visitante que pulsa el enlace del email NO tiene sesión, y el rol anon
 * no puede leer `reserva` (RLS), así que se usa la clave de servicio si está
 * configurada y, si no, la RPC SECURITY DEFINER `get_reserva_by_calendar_token`
 * (migración 022).
 */
async function findReservation(token: string): Promise<CalendarReservation | null> {
  const service = createServiceClient();
  if (service) {
    const { data, error } = await service
      .from("reserva")
      .select("nombre, fecha_reserva, hora_inicio, hora_fin, estado, servicio(nombre)")
      .eq("calendar_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    if (data.estado === "cancelada" || data.estado === "rechazada") return null;
    const servicio = Array.isArray(data.servicio) ? data.servicio[0] : data.servicio;
    return {
      nombre: data.nombre,
      fecha_reserva: data.fecha_reserva,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      servicio_nombre: (servicio as { nombre?: string } | null)?.nombre ?? "Sesión",
    };
  }

  const publicClient = createPublicClient();
  if (!publicClient) return null;

  const { data, error } = await publicClient.rpc("get_reserva_by_calendar_token", { p_token: token });
  if (error) {
    console.error("[Calendar] RPC get_reserva_by_calendar_token:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? (data[0] as CalendarReservation | undefined) : null;
  return row ?? null;
}

/** Escapa texto para propiedades iCalendar (RFC 5545 §3.3.11). */
function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** YYYY-MM-DD → YYYYMMDD, con desplazamiento opcional de días. */
function icsDate(isoDate: string, addDays = 0): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + addDays));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** "HH:mm[:ss]" → "HHmmss". */
function icsTime(time: string): string {
  const [h, m = "00", s = "00"] = time.split(":");
  return `${h.padStart(2, "0")}${m.padStart(2, "0")}${s.padStart(2, "0")}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit: máximo 30 descargas por IP por hora
  const rateCheck = await checkRateLimit("calendar-ics", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Demasiadas descargas. Inténtalo en ${formatRetryAfter(rateCheck.retryAfterMs)}.` },
      { status: 429 }
    );
  }

  const { token } = await params;

  if (!token || !isUuid(token)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const reserva = await findReservation(token);

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada o eliminada" }, { status: 404 });
  }

  if (!reserva.fecha_reserva || !reserva.hora_inicio || !reserva.hora_fin) {
    return NextResponse.json({ error: "La reserva no tiene fecha u hora definida" }, { status: 400 });
  }

  // Fin a medianoche ("24:00" o "00:00") → 00:00 del día siguiente
  const endHour = reserva.hora_fin.split(":")[0];
  const endsAtMidnight = endHour === "24" || (endHour === "00" && reserva.hora_fin.startsWith("00:00"));

  const dtStart = `${icsDate(reserva.fecha_reserva)}T${icsTime(reserva.hora_inicio)}`;
  const dtEnd = endsAtMidnight
    ? `${icsDate(reserva.fecha_reserva, 1)}T000000`
    : `${icsDate(reserva.fecha_reserva)}T${icsTime(reserva.hora_fin)}`;

  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const servicio = escapeIcs(reserva.servicio_nombre || "Sesión");
  const cliente = escapeIcs(reserva.nombre || "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Garage Studios//Sistema de Reservas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${token}@garagestudios.es`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Atlantic/Canary:${dtStart}`,
    `DTEND;TZID=Atlantic/Canary:${dtEnd}`,
    `SUMMARY:Reserva Garage Studios - ${servicio}`,
    `DESCRIPTION:Reserva confirmada en Garage Studios.\\nServicio: ${servicio}\\nCliente: ${cliente}\\nContacto: +34 661 65 26 38`,
    "LOCATION:C. Drago\\, 35010 Las Palmas de Gran Canaria\\, Las Palmas",
    "URL:https://garagestudios.es",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reserva-garage-studios.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
