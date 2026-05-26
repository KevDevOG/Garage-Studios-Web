"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limit";
import { sendAdminNotification } from "@/lib/email";


export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  acceptPrivacy: boolean;
  turnstileToken?: string;
}

export async function submitContactAction(data: ContactData) {
  if (!data.acceptPrivacy) {
    throw new Error("Debes aceptar la política de privacidad para enviar el mensaje.");
  }

  // Rate limit: máximo 5 envíos por IP por hora
  const rateCheck = await checkRateLimit("contact", 5);
  if (!rateCheck.allowed) {
    throw new Error(
      `Has enviado demasiados mensajes. Inténtalo de nuevo en ${formatRetryAfter(rateCheck.retryAfterMs)}.`
    );
  }

  // Turnstile: verificar captcha anti-bot
  const turnstileResult = await verifyTurnstileToken(data.turnstileToken);
  if (!turnstileResult.success) {
    throw new Error(turnstileResult.error || "Verificación anti-bot fallida.");
  }

  const supabase = await createClient();

  // Insertar datos en la tabla contacto
  const { error } = await supabase.from("contacto").insert([
    {
      nombre: data.name,
      email: data.email,
      telefono: data.phone,
      asunto: data.subject,
      mensaje: data.message,
      accepted_privacy_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error al insertar contacto en Supabase:", error);
    throw new Error("No se pudo enviar el mensaje. Inténtalo más tarde.");
  }

  try {
    const htmlBody = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Teléfono:</strong> ${data.phone || 'No especificado'}</p>
      <p><strong>Asunto:</strong> ${data.subject}</p>
      <p><strong>Mensaje:</strong><br/>${data.message.replace(/\n/g, '<br/>')}</p>
    `;
    await sendAdminNotification("Nuevo mensaje desde la web de Garage Studios", htmlBody);
  } catch (err) {
    console.error("Error enviando email de notificación de contacto:", err);
  }
}
