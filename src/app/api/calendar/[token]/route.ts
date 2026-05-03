import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: reserva, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .eq("calendar_token", token)
    .is("deleted_at", null)
    .single();

  if (error || !reserva) {
    return NextResponse.json({ error: "Reserva no encontrada o eliminada" }, { status: 404 });
  }

  if (!reserva.fecha_reserva || !reserva.hora_inicio || !reserva.hora_fin) {
    return NextResponse.json({ error: "La reserva no tiene fecha u hora definida" }, { status: 400 });
  }

  // Format dates: YYYYMMDDTHHMMSS
  const datePart = reserva.fecha_reserva.replace(/-/g, ""); // 2026-05-10 -> 20260510
  const startTimePart = reserva.hora_inicio.replace(/:/g, "").substring(0, 6); // 10:00:00 -> 100000
  const endTimePart = reserva.hora_fin.replace(/:/g, "").substring(0, 6); // 12:00:00 -> 120000

  const dtStart = `${datePart}T${startTimePart}`;
  const dtEnd = `${datePart}T${endTimePart}`;
  
  // Current time for DTSTAMP (must be UTC and end with Z)
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const servicioNombre = Array.isArray(reserva.servicio) 
    ? reserva.servicio[0]?.nombre 
    : (reserva.servicio as any)?.nombre || "Sesión";

  // Build the .ics string
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Garage Studios//Sistema de Reservas//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${token}@garagestudios.es
DTSTAMP:${dtStamp}
DTSTART;TZID=Atlantic/Canary:${dtStart}
DTEND;TZID=Atlantic/Canary:${dtEnd}
SUMMARY:Reserva Garage Studios - ${servicioNombre}
DESCRIPTION:Reserva confirmada en Garage Studios.\\nServicio: ${servicioNombre}\\nCliente: ${reserva.nombre}\\nContacto: +34 693 48 93 79
LOCATION:C. Drago\\, 35010 Las Palmas de Gran Canaria\\, Las Palmas
END:VEVENT
END:VCALENDAR`;

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="reserva-garage-studios.ics"`,
    },
  });
}
