import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailReservationData {
  nombre: string;
  servicioNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
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
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject: "Reserva confirmada en Garage Studios",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #000;">¡Reserva Confirmada!</h2>
          <p>Hola <strong>${reserva.nombre}</strong>,</p>
          <p>Tu reserva en Garage Studios ha sido confirmada correctamente.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Servicio:</strong> ${reserva.servicioNombre}</p>
            <p style="margin: 0 0 10px 0;"><strong>Fecha:</strong> ${reserva.fecha}</p>
            <p style="margin: 0;"><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaFin}</p>
          </div>

          <h3 style="margin-top: 30px;">Cómo llegar</h3>
          <p>📍 <strong>Dirección:</strong> C. Drago, 35010 Las Palmas de Gran Canaria, Las Palmas</p>
          <p>
            <a href="https://maps.app.goo.gl/heSYXrycMkAFsBoCA" 
               style="color: #1a73e8; text-decoration: none; font-weight: bold;">
               Ver en Google Maps
            </a>
          </p>

          <h3 style="margin-top: 30px;">Contacto</h3>
          <p>Si necesitas cambiar o cancelar tu reserva, por favor contáctanos lo antes posible.</p>
          <p>📱 <strong>WhatsApp del estudio:</strong> +34 693 48 93 79</p>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">
            Gracias por confiar en Garage Studios.<br>Nos vemos pronto.
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
