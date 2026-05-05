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

export async function sendReservationConfirmationEmail(
  to: string,
  reserva: EmailReservationData
) {
  if (!resend) {
    console.warn("No se pudo enviar el email: RESEND_API_KEY no está configurado.");
    return { error: "Configuración de email ausente (RESEND_API_KEY)." };
  }

  // Utiliza el EMAIL_FROM si existe, si no usa el de pruebas de resend
  const from = process.env.EMAIL_FROM || "Garage Studios <reservas@mail.garagestudios.es>";

  // Construir enlace .ics del calendario si existe el token
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://garagestudios.es";
  const calendarLink = reserva.calendarToken
    ? `${siteUrl}/api/calendar/${reserva.calendarToken}`
    : null;

  const calendarSection = calendarLink
    ? `
          <h3 style="margin-top: 30px;">📅 Añadir al calendario</h3>
          <p>
            <a href="${calendarLink}" 
               style="display: inline-block; background-color: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
               Descargar evento (.ics)
            </a>
          </p>
    `
    : "";

  const precioSection = reserva.precio 
    ? `<p style="margin: 0 0 12px 0; font-size: 14px;">💶 <strong>Precio:</strong> ${reserva.precio}€</p>` 
    : "";

  try {
    const data = await resend.emails.send({
      from,
      to,
      replyTo: "hola@garagestudios.es",
      subject: "Reserva confirmada en Garage Studios",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #ffffff; padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000; font-size: 24px; margin: 0;">Reserva Confirmada ✅</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">Hola <strong>${reserva.nombre}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Tu reserva en <strong>Garage Studios</strong> ha sido confirmada.</p>
          
          <div style="background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 0 0 12px 0; font-size: 14px;">🎵 <strong>Servicio:</strong> ${reserva.servicioNombre}</p>
            ${precioSection}
            <p style="margin: 0 0 12px 0; font-size: 14px;">📅 <strong>Fecha:</strong> ${reserva.fecha}</p>
            <p style="margin: 0; font-size: 14px;">🕐 <strong>Hora:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</p>
          </div>

          <h3 style="margin-top: 30px;">📍 Dirección</h3>
          <p style="font-size: 14px; line-height: 1.6;">C. Drago, 35010, Las Palmas de Gran Canaria</p>
          <p>
            <a href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA" 
               style="color: #1a73e8; text-decoration: none; font-weight: bold; font-size: 14px;">
               Ver en Google Maps →
            </a>
          </p>

          ${calendarSection}

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          
          <p style="font-size: 14px; line-height: 1.6; color: #555;">
            Si necesitas cambiar algo o tienes alguna duda antes de la sesión, puedes responder a este correo o contactar con nosotros por WhatsApp.
          </p>
          <p style="font-size: 14px;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/34693489379" style="color: #1a73e8; text-decoration: none;">+34 693 48 93 79</a></p>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.6;">
            Gracias por confiar en Garage Studios.<br>Nos vemos en el estudio. 🎶
          </p>
        </div>
      `,
    });

    return { data };
  } catch (error) {
    console.error("Error al enviar email de confirmación:", error);
    return { error: error instanceof Error ? error.message : "Error desconocido al enviar email" };
  }
}
