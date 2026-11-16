"use server";

import { createPublicWriteClient } from "@/lib/supabase/public";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes, isSlotWithinOpeningHours, formatTime } from "@/lib/schedule";
import { findOrCreateClientePublic } from "@/lib/cliente-repo";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, formatRetryAfter, getClientIp } from "@/lib/rate-limit";
import { sendAdminNotification } from "@/lib/email";
import { validateReservationInput, isSlotInPast, MAX_PENDING_PER_CONTACT } from "@/lib/reservation-rules";
import { formatIsoDateEs, todayInStudio, weekdayOfIsoDate } from "@/lib/dates";
import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/html";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

export interface ReservationData {
  name: string;
  phone: string;
  email: string;
  service: string; // UUID
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  notes: string;
  acceptPrivacy: boolean;
  turnstileToken?: string;
}

const GENERIC_ERROR = "No se pudo enviar la solicitud. Inténtalo más tarde o escríbenos por WhatsApp.";
const SLOT_TAKEN_ERROR = "Ese horario ya no está disponible. Elige otra hora.";

/**
 * Solicitud de reserva desde la web pública.
 *
 * Devuelve `{ ok, error }` en lugar de lanzar: en producción Next.js oculta
 * al navegador los mensajes de los errores lanzados en Server Actions.
 */
export async function submitReservationAction(raw: ReservationData): Promise<ActionResult> {
  // 1. Validación de servidor (formato, longitud, fecha no pasada, privacidad)
  const parsed = validateReservationInput(raw);
  if (!parsed.ok) return actionError(parsed.error);
  const data = parsed.data;

  // 2. Rate limit: máximo 5 intentos por IP por hora
  const rateCheck = await checkRateLimit("reservation", 5);
  if (!rateCheck.allowed) {
    return actionError(
      `Has enviado demasiadas solicitudes. Inténtalo de nuevo en ${formatRetryAfter(rateCheck.retryAfterMs)}.`
    );
  }

  // 3. Turnstile anti-bot (falla en cerrado)
  const turnstileResult = await verifyTurnstileToken(raw.turnstileToken, await getClientIp());
  if (!turnstileResult.success) {
    return actionError(turnstileResult.error || "Verificación anti-bot fallida.");
  }

  // Escritura solo desde el servidor (clave de servicio; ver createPublicWriteClient)
  const { client: supabase, privileged } = createPublicWriteClient();
  if (!supabase) {
    console.error("[Reservation] Supabase no configurado");
    return actionError(GENERIC_ERROR);
  }

  // 3b. Cuota en BD por contacto: no depende de la instancia ni de la IP
  if (privileged && (await countPendingByContact(supabase, data.email, data.phone)) >= MAX_PENDING_PER_CONTACT) {
    return actionError(
      "Ya tienes solicitudes pendientes de confirmar. Te escribiremos en breve; si es urgente, contáctanos por WhatsApp."
    );
  }

  // 4. Servicio (solo activos) y su duración
  const { data: servicio, error: srvErr } = await supabase
    .from("servicio")
    .select("nombre, duracion_minutos, precio")
    .eq("id", data.service)
    .eq("activo", true)
    .maybeSingle();

  if (srvErr || !servicio) {
    return actionError("El servicio seleccionado no está disponible.");
  }

  const duracion = Number(servicio.duracion_minutos);
  if (!Number.isFinite(duracion) || duracion <= 0) {
    return actionError("Este servicio no admite reserva online. Contáctanos directamente.");
  }

  // 5. Reglas de horario que NO deben depender del navegador
  if (!isSlotWithinOpeningHours(weekdayOfIsoDate(data.date), data.timeSlot, duracion)) {
    return actionError("El horario seleccionado está fuera del horario de apertura del estudio.");
  }
  if (isSlotInPast(data.date, data.timeSlot)) {
    return actionError("Esa hora ya ha pasado. Elige otro horario.");
  }

  const horaInicio = data.timeSlot;
  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  // 6. Disponibilidad (reservas, bloques y bloqueos). La restricción de
  //    exclusión en la base de datos cubre la condición de carrera.
  const isAvailable = await validateSlotAvailable(data.date, horaInicio, duracion);
  if (!isAvailable) return actionError(SLOT_TAKEN_ERROR);

  // 7. Cliente (opcional: si ya existe por email/teléfono, RLS impide buscarlo
  //    y se deja sin vincular; el admin puede vincularlo después)
  let clienteId: string | null = null;
  try {
    clienteId = await findOrCreateClientePublic(supabase, {
      nombre: data.name,
      email: data.email,
      telefono: data.phone,
      origen: "web",
    });
  } catch (err) {
    console.warn("[Reservation] No se pudo crear el cliente:", err);
  }

  // 8. Insertar la reserva
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
      precio: servicio.precio,
      origen: "web",
      cliente_id: clienteId,
      accepted_privacy_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("[Reservation] Error al insertar:", error.code, error.message);
    if (error.code === "23P01" || error.message?.includes("reserva_no_overlap")) {
      return actionError(SLOT_TAKEN_ERROR);
    }
    return actionError(GENERIC_ERROR);
  }

  // 9. Aviso al estudio (no bloquea la respuesta al usuario si falla)
  try {
    await sendAdminNotification(
      "Nueva reserva desde la web de Garage Studios",
      buildAdminReservationEmail({
        nombre: data.name,
        email: data.email,
        telefono: data.phone,
        servicio: String(servicio.nombre),
        fecha: data.date,
        horaInicio,
        horaFin,
        duracion,
        notas: data.notes,
      })
    );
  } catch (err) {
    console.error("[Reservation] Error enviando aviso al estudio:", err);
  }

  return actionOk();
}

/**
 * Solicitudes pendientes y futuras con el mismo email o teléfono. Dos
 * consultas `.eq()` (y no un `.or()`) para que ningún carácter del email
 * altere la sintaxis del filtro. Requiere la clave de servicio.
 */
async function countPendingByContact(supabase: SupabaseClient, email: string, phone: string): Promise<number> {
  const today = todayInStudio();
  const base = () =>
    supabase
      .from("reserva")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente")
      .is("deleted_at", null)
      .gte("fecha_reserva", today);

  const [byEmail, byPhone] = await Promise.all([base().eq("email", email), base().eq("telefono", phone)]);
  if (byEmail.error || byPhone.error) {
    // No bloquea al cliente por un fallo de lectura: Turnstile y el rate limit siguen activos.
    console.error("[Reservation] No se pudo comprobar la cuota:", byEmail.error?.code ?? byPhone.error?.code);
    return 0;
  }
  return Math.max(byEmail.count ?? 0, byPhone.count ?? 0);
}

interface AdminEmailData {
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracion: number;
  notas: string;
}

function buildAdminReservationEmail(d: AdminEmailData): string {
  const row = (label: string, value: string, last = false) =>
    `<p style="margin: 0 ${last ? "" : "0 8px 0"}; font-size: 14px; color: #e0e0e0;"><strong style="color: #ffffff;">${label}:</strong> ${value}</p>`;

  return `
    <div style="background-color: #000000; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #333333; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://garagestudios.es/images/logo-sin-fondo.png" alt="Garage Studios" style="width: 150px; height: auto; margin-bottom: 20px;" />
          <h2 style="color: #fbbf24; font-size: 22px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Nueva Solicitud de Reserva</h2>
          <p style="color: #a0a0a0; font-size: 14px; margin-top: 5px;">Se ha recibido una nueva reserva a través de la web</p>
        </div>

        <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Datos del Cliente</h3>
          ${row("Nombre", escapeHtml(d.nombre))}
          ${row("Email", escapeHtml(d.email))}
          ${row("Teléfono", escapeHtml(d.telefono), true)}
        </div>

        <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Detalles del Servicio</h3>
          ${row("Servicio", escapeHtml(d.servicio))}
          ${row("Fecha", escapeHtml(formatIsoDateEs(d.fecha)))}
          ${row("Hora", `${formatTime(d.horaInicio)} - ${formatTime(d.horaFin)} (${d.duracion} min)`, true)}
        </div>

        <div style="background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px;">
          <h3 style="color: #fbbf24; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #333333; padding-bottom: 8px;">Notas o Mensaje</h3>
          <p style="margin: 0; font-size: 14px; color: #e0e0e0; line-height: 1.5;">${d.notas ? escapeHtmlMultiline(d.notas) : "Ninguna"}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #333333; padding-top: 20px;">
          <p style="font-size: 11px; color: #666666; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">
            Garage Studios &copy; ${new Date().getFullYear()} · Gestión de reservas
          </p>
        </div>
      </div>
    </div>
  `;
}
