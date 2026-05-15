import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailReservationData {
  nombre: string;
  servicioNombre: string;
  precio?: number | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  calendarToken?: string;
}

interface TemplateProps {
  title: string;
  intro: string;
  nombre: string;
  servicioNombre: string;
  precio?: number | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  footer: string;
  calendarUrl?: string | null;
}

function buildReservationEmailTemplate({
  title,
  intro,
  nombre,
  servicioNombre,
  precio,
  fecha,
  horaInicio,
  horaFin,
  footer,
  calendarUrl,
}: TemplateProps) {
  const precioSection = precio
    ? `<p style="margin: 0 0 12px 0; font-size: 14px;">💶 <strong>Precio:</strong> ${precio}€</p>`
    : "";

  const calendarSection = calendarUrl
    ? `
          <div style="text-align: center; margin-bottom: 40px; padding-top: 10px;">
            <h3 style="margin-top: 30px; color: #ffffff;">📅 Añadir al calendario</h3>
            <p>
              <a href="${calendarUrl}" 
                 style="display: inline-block; background-color: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                 Descargar evento (.ics)
              </a>
            </p>
          </div>
    `
    : "";

  return `
    <div style="background-color: #000000; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #333333;">
        
        <!-- Logo Header -->
        <div style="padding: 40px 20px 20px; text-align: center;">
          <img src="https://garagestudios.es/images/logo-sin-fondo.png" 
               alt="Garage Studios" 
               style="width: 180px; height: auto; display: block; margin: 0 auto;" />
        </div>

        <!-- Content Body -->
        <div style="padding: 20px 40px 40px; color: #ffffff;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px; text-align: center; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">${title}</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #bbbbbb; margin-bottom: 30px; text-align: center;">
            Hola <strong>${nombre}</strong>,<br>
            ${intro}
          </p>
          
          <!-- Reservation Details Card -->
          <div style="background-color: #1a1a1a; border: 1px solid #333333; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
            <div style="margin-bottom: 15px; display: flex; align-items: center;">
              <span style="font-size: 14px; color: #fbbf24; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la reserva</span>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff;">🎵 <strong>Servicio:</strong> ${servicioNombre}</p>
            ${precioSection}
            <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff;">📅 <strong>Fecha:</strong> ${fecha}</p>
            <p style="margin: 0; font-size: 15px; color: #ffffff;">🕐 <strong>Hora:</strong> ${horaInicio} - ${horaFin}</p>
          </div>

          <!-- Location Section (Solo para confirmaciones) -->
          ${calendarUrl ? `
          <div style="margin-bottom: 30px; border-left: 3px solid #fbbf24; padding-left: 20px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; color: #ffffff;">📍 Dónde estamos</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #bbbbbb; margin: 0 0 10px;">
              C. Drago, 35010<br>Las Palmas de Gran Canaria
            </p>
            <a href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA" 
               style="color: #fbbf24; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
               Abrir en Google Maps →
            </a>
          </div>
          ` : ''}

          <!-- Calendar Action -->
          ${calendarSection}

          <!-- Footer Info -->
          <div style="border-top: 1px solid #333333; padding-top: 30px; text-align: center;">
            <p style="font-size: 13px; line-height: 1.6; color: #888888; margin-bottom: 20px;">
              ${footer}
            </p>
            <div style="display: flex; justify-content: center; gap: 10px;">
              <a href="https://wa.me/34693489379" 
                 style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; background-color: #25D366; padding: 10px 20px; border-radius: 8px; margin: 5px;">
                 📱 WhatsApp
              </a>
              <a href="mailto:garagestudioslp@gmail.com" 
                 style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; background-color: #333333; padding: 10px 20px; border-radius: 8px; margin: 5px;">
                 📧 Email
              </a>
            </div>
          </div>
        </div>

        <!-- Fine Print -->
        <div style="background-color: #0a0a0a; padding: 20px; text-align: center;">
          <p style="font-size: 11px; color: #555555; margin: 0; letter-spacing: 0.025em; text-transform: uppercase;">
            Garage Studios &copy; ${new Date().getFullYear()} · Donde el sonido cobra vida
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendReservationConfirmationEmail(
  to: string,
  reserva: EmailReservationData
) {
  if (!resend) return { error: "RESEND_API_KEY no configurado" };

  const from = process.env.EMAIL_FROM || "Garage Studios <reservas@mail.garagestudios.es>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garagestudios.es";
  const calendarLink = reserva.calendarToken ? `${siteUrl}/api/calendar/${reserva.calendarToken}` : null;

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo: "garagestudioslp@gmail.com",
      subject: "Reserva confirmada en Garage Studios",
      html: buildReservationEmailTemplate({
        title: "Reserva Confirmada ✅",
        intro: "Tu sesión en <strong>Garage Studios</strong> ha sido confirmada con éxito.",
        nombre: reserva.nombre,
        servicioNombre: reserva.servicioNombre,
        precio: reserva.precio,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        calendarUrl: calendarLink,
        footer: "Este es un correo automático. Si tienes alguna duda antes de la sesión, puedes responder directamente o contactar por WhatsApp.",
      }),
    });
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function sendReservationCancelledEmail(
  to: string,
  reserva: EmailReservationData
) {
  if (!resend) return { error: "RESEND_API_KEY no configurado" };

  const from = process.env.EMAIL_FROM || "Garage Studios <reservas@mail.garagestudios.es>";

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo: "garagestudioslp@gmail.com",
      subject: "Reserva cancelada en Garage Studios",
      html: buildReservationEmailTemplate({
        title: "Reserva Cancelada",
        intro: "Te informamos de que tu reserva en <strong>Garage Studios</strong> ha sido cancelada.",
        nombre: reserva.nombre,
        servicioNombre: reserva.servicioNombre,
        precio: reserva.precio,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        footer: "Si crees que se trata de un error o quieres solicitar una nueva fecha, puedes responder a este correo o contactar con nosotros.",
      }),
    });
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

export async function sendReservationCompletedEmail(
  to: string,
  reserva: EmailReservationData
) {
  if (!resend) return { error: "RESEND_API_KEY no configurado" };

  const from = process.env.EMAIL_FROM || "Garage Studios <reservas@mail.garagestudios.es>";

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo: "garagestudioslp@gmail.com",
      subject: "Gracias por venir a Garage Studios",
      html: buildReservationEmailTemplate({
        title: "Sesión Completada",
        intro: "Tu reserva en <strong>Garage Studios</strong> ha quedado marcada como completada.",
        nombre: reserva.nombre,
        servicioNombre: reserva.servicioNombre,
        precio: reserva.precio,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        footer: "Gracias por confiar en Garage Studios para tu proyecto. Si quieres volver a reservar otra sesión o necesitas cualquier cosa, puedes responder a este correo.",
      }),
    });
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

