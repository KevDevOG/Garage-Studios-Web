import { NextResponse } from "next/server";
import { createPublicClient, createServiceClient } from "@/lib/supabase/public";
import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limit";
import { isUuid } from "@/lib/reservation-rules";
import { buildReservationIcs, isIcsLinkActive, type IcsReservation } from "@/lib/ics";

/** Cabeceras comunes: nada de caché compartida, indexación ni Referer. */
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
} as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_HEADERS });
}

/**
 * Busca la reserva por su token de calendario.
 *
 * El visitante que pulsa el enlace del email NO tiene sesión, y el rol anon
 * no puede leer `reserva` (RLS), así que se usa la clave de servicio si está
 * configurada (solo servidor) y, si no, la RPC SECURITY DEFINER
 * `get_reserva_by_calendar_token` (migración 022). Ambos caminos devuelven
 * exactamente los mismos campos, sin datos personales.
 */
async function findReservation(token: string): Promise<IcsReservation | null> {
  const service = createServiceClient();
  if (service) {
    const { data, error } = await service
      .from("reserva")
      .select("fecha_reserva, hora_inicio, hora_fin, estado, servicio(nombre)")
      .eq("calendar_token", token)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    if (data.estado === "cancelada" || data.estado === "rechazada") return null;
    const servicio = Array.isArray(data.servicio) ? data.servicio[0] : data.servicio;
    return {
      fecha_reserva: data.fecha_reserva,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      servicio_nombre: (servicio as { nombre?: string } | null)?.nombre ?? null,
    };
  }

  const publicClient = createPublicClient({ fresh: true });
  if (!publicClient) return null;

  const { data, error } = await publicClient.rpc("get_reserva_by_calendar_token", { p_token: token });
  if (error) {
    console.error("[Calendar] RPC get_reserva_by_calendar_token:", error.code);
    return null;
  }
  const row = Array.isArray(data) ? (data[0] as IcsReservation | undefined) : null;
  return row ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit: máximo 30 descargas por IP por hora
  const rateCheck = await checkRateLimit("calendar-ics", 30);
  if (!rateCheck.allowed) {
    return jsonError(`Demasiadas descargas. Inténtalo en ${formatRetryAfter(rateCheck.retryAfterMs)}.`, 429);
  }

  const { token } = await params;

  if (!token || !isUuid(token)) {
    return jsonError("Enlace no válido", 400);
  }

  const reserva = await findReservation(token);

  // Mismo mensaje para "no existe", "cancelada" y "caducada": no se revela
  // si un token corresponde a una reserva real.
  if (
    !reserva ||
    !reserva.fecha_reserva ||
    !reserva.hora_inicio ||
    !reserva.hora_fin ||
    !isIcsLinkActive(reserva.fecha_reserva)
  ) {
    return jsonError("Reserva no encontrada o enlace caducado", 404);
  }

  return new NextResponse(buildReservationIcs(token, reserva), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reserva-garage-studios.ics"',
    },
  });
}
