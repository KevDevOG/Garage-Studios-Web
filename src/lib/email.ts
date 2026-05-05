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
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px; text-align: center; font-weight: 800; letter-spacing: -0.025em;">RESERVA CONFIRMADA ✅</h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #bbbbbb; margin-bottom: 30px; text-align: center;">
                Hola <strong>${reserva.nombre}</strong>,<br>
                Tu sesión en <strong>Garage Studios</strong> ha sido confirmada con éxito.
              </p>
              
              <!-- Reservation Details Card -->
              <div style="background-color: #1a1a1a; border: 1px solid #333333; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                <div style="margin-bottom: 15px; display: flex; align-items: center;">
                  <span style="font-size: 14px; color: #fbbf24; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la reserva</span>
                </div>
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff;">🎵 <strong>Servicio:</strong> ${reserva.servicioNombre}</p>
                ${precioSection}
                <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff;">📅 <strong>Fecha:</strong> ${reserva.fecha}</p>
                <p style="margin: 0; font-size: 15px; color: #ffffff;">🕐 <strong>Hora:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</p>
              </div>

              <!-- Location Section -->
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

              <!-- Calendar Action -->
              <div style="text-align: center; margin-bottom: 40px; padding-top: 10px;">
                ${calendarSection}
              </div>

              <!-- Footer Info -->
              <div style="border-top: 1px solid #333333; padding-top: 30px; text-align: center;">
                <p style="font-size: 13px; line-height: 1.6; color: #888888; margin-bottom: 15px;">
                  Este es un correo automático, por favor no respondas a este mensaje. Si tienes alguna duda antes de la sesión, contacta con nosotros por WhatsApp.
                </p>
                <a href="https://wa.me/34693489379" 
                   style="display: inline-flex; align-items: center; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; background-color: #25D366; padding: 10px 20px; border-radius: 8px;">
                   📱 Contactar por WhatsApp
                </a>
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
      `,
    });

    return { data };
  } catch (error) {
    console.error("Error al enviar email de confirmación:", error);
    return { error: error instanceof Error ? error.message : "Error desconocido al enviar email" };
  }
}
