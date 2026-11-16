"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limit";
import { sendAdminNotification } from "@/lib/email";
import { validateContactInput } from "@/lib/reservation-rules";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/html";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  acceptPrivacy: boolean;
  turnstileToken?: string;
}

/**
 * Mensaje de contacto desde la web pública. Devuelve `{ ok, error }`;
 * nunca lanza para que el usuario vea el motivo real en producción.
 */
export async function submitContactAction(raw: ContactData): Promise<ActionResult> {
  const parsed = validateContactInput(raw);
  if (!parsed.ok) return actionError(parsed.error);
  const data = parsed.data;

  // Rate limit: máximo 5 envíos por IP por hora
  const rateCheck = await checkRateLimit("contact", 5);
  if (!rateCheck.allowed) {
    return actionError(
      `Has enviado demasiados mensajes. Inténtalo de nuevo en ${formatRetryAfter(rateCheck.retryAfterMs)}.`
    );
  }

  const turnstileResult = await verifyTurnstileToken(raw.turnstileToken);
  if (!turnstileResult.success) {
    return actionError(turnstileResult.error || "Verificación anti-bot fallida.");
  }

  const supabase = createPublicClient({ fresh: true });
  if (!supabase) {
    console.error("[Contact] Supabase no configurado");
    return actionError("No se pudo enviar el mensaje. Inténtalo más tarde o escríbenos por WhatsApp.");
  }

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
    console.error("[Contact] Error al insertar:", error.code, error.message);
    return actionError("No se pudo enviar el mensaje. Inténtalo más tarde o escríbenos por WhatsApp.");
  }

  try {
    const htmlBody = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Teléfono:</strong> ${data.phone ? escapeHtml(data.phone) : "No especificado"}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(data.subject)}</p>
      <p><strong>Mensaje:</strong><br/>${escapeHtmlMultiline(data.message)}</p>
    `;
    await sendAdminNotification("Nuevo mensaje desde la web de Garage Studios", htmlBody);
  } catch (err) {
    console.error("[Contact] Error enviando aviso al estudio:", err);
  }

  return actionOk();
}
