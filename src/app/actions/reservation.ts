"use server";

import { createClient } from "@/lib/supabase/server";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes } from "@/lib/schedule";
import { findOrCreateClientePublic, updateClienteStats } from "@/app/actions/clientes";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limit";
import { sendAdminNotification } from "@/lib/email";


export interface ReservationData {
  name: string;
  phone: string;
  email: string;
  service: string; // UUID
  date: string;
  timeSlot: string; // HH:mm
  notes: string;
  acceptPrivacy: boolean;
  turnstileToken?: string;
}

export async function submitReservationAction(data: ReservationData) {
  if (!data.acceptPrivacy) {
    throw new Error("Debes aceptar la política de privacidad para solicitar la reserva.");
  }

  // Rate limit: máximo 5 intentos por IP por hora
  const rateCheck = await checkRateLimit("reservation", 5);
  if (!rateCheck.allowed) {
    throw new Error(
      `Has enviado demasiadas solicitudes. Inténtalo de nuevo en ${formatRetryAfter(rateCheck.retryAfterMs)}.`
    );
  }

  // Turnstile: verificar captcha anti-bot
  const turnstileResult = await verifyTurnstileToken(data.turnstileToken);
  if (!turnstileResult.success) {
    throw new Error(turnstileResult.error || "Verificación anti-bot fallida.");
  }

  const supabase = await createClient();

  // 1. Obtener nombre, duración y precio base del servicio
  const { data: servicio, error: srvErr } = await supabase
    .from("servicio")
    .select("nombre, duracion_minutos, precio")
    .eq("id", data.service)
    .single();

  if (srvErr || !servicio) {
    throw new Error("Servicio no encontrado.");
  }

  const duracion = servicio.duracion_minutos;
  const precioBase = servicio.precio;
  const nombreServicio = servicio.nombre;
  const horaInicio = data.timeSlot;
  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  // 2. Validar disponibilidad en servidor (prevenir race conditions)
  const isAvailable = await validateSlotAvailable(
    data.date,
    horaInicio,
    duracion
  );

  if (!isAvailable) {
    throw new Error(
      "El horario seleccionado ya no está disponible. Por favor, elige otro."
    );
  }

  // 2.5. Validar explícitamente solapamiento de reservas en la base de datos
  const newStart = timeToMinutes(horaInicio);
  const newEnd = newStart + duracion;

  // Create admin client to bypass RLS for reading reservations
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: existingReservations, error: overlapErr } = await supabaseAdmin
    .from("reserva")
    .select("hora_inicio, hora_fin, estado")
    .eq("fecha_reserva", data.date);

  if (!overlapErr && existingReservations) {
    for (const res of existingReservations) {
      if (res.estado === "cancelada") continue;
      
      if (res.estado === "pendiente" || res.estado === "confirmada") {
        if (!res.hora_inicio || !res.hora_fin) continue;
        const existingStart = timeToMinutes(res.hora_inicio);
        const existingEnd = timeToMinutes(res.hora_fin);

        if (newStart < existingEnd && newEnd > existingStart) {
          throw new Error("Ese horario ya no está disponible. Elige otra hora.");
        }
      }
    }
  }

  // 3. Crear o encontrar cliente (opcional en flujo público por RLS)
  let clienteId: string | null = null;
  try {
    clienteId = await findOrCreateClientePublic(supabase, {
      nombre: data.name,
      email: data.email,
      telefono: data.phone,
      origen: "web",
    });
  } catch (err) {
    console.warn("No se pudo crear cliente desde reserva pública:", err);
    clienteId = null;
  }

  // 4. Insertar reserva con cliente_id
  const { error } = await supabase.from("reserva").insert([
    {
      servicio_id: data.service,
      nombre: data.name,
      telefono: data.phone,
      email: data.email,
      fecha_reserva: data.date,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracion,
      observaciones: data.notes || null,
      estado: "pendiente",
      precio: precioBase,
      origen: "web",
      cliente_id: clienteId,
      accepted_privacy_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error al insertar reserva en Supabase:", error);
    if (error.code === "23P01" || error.message?.includes("reserva_no_overlap")) {
      throw new Error("Ese horario ya no está disponible. Elige otra hora.");
    }
    throw new Error("No se pudo enviar la solicitud. Inténtalo más tarde.");
  }

  // 5. Actualizar estadísticas del cliente
  if (clienteId) {
    await updateClienteStats(supabase, clienteId);
  }

  try {
    const htmlBody = `
      <div style="background-color: #000000; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #333333; padding: 40px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://garagestudios.es/images/logo-sin-fondo.png" alt="Garage Studios" style="width: 150px; height: auto; margin-bottom: 20px;" />
            <h2 style="color: #fbbf24; font-size: 22px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Nueva Solicitud de Reserva</h2>
            <p style="color: #a0a0a0; font-size: 14px; margin-top: 5px;">Se ha recibido una nueva reserva a través de la web</p>
          </div>

          <!-- Customer Info -->
          <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Datos del Cliente</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Nombre:</strong> ${data.name}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Email:</strong> ${data.email}</p>
            <p style="margin: 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Teléfono:</strong> ${data.phone}</p>
          </div>

          <!-- Reservation Details -->
          <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Detalles del Servicio</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Servicio:</strong> ${nombreServicio}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Fecha:</strong> ${data.date}</p>
            <p style="margin: 0; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">Hora:</strong> ${horaInicio} - ${horaFin} (${duracion} min)</p>
          </div>

          <!-- Notes -->
          <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px;">
            <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Notas o Mensaje</h3>
            <p style="margin: 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">${data.notes ? data.notes.replace(/\n/g, '<br/>') : 'Ninguna'}</p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #333333; padding-top: 20px;">
            <p style="font-size: 11px; color: #666666; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
              Garage Studios &copy; ${new Date().getFullYear()} · Gestión de reservas
            </p>
          </div>
        </div>
      </div>
    `;
    await sendAdminNotification("Nueva reserva desde la web de Garage Studios", htmlBody);
  } catch (err) {
    console.error("Error enviando email de notificación de reserva:", err);
  }
}
