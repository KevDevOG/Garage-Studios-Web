/**
 * Cloudflare Turnstile — Verificación server-side
 *
 * Falla en CERRADO: si Cloudflare no responde, devuelve un error o falta la
 * clave secreta en producción, el envío se rechaza (antes se aceptaba y era
 * una vía para saltarse el antispam).
 *
 * Solo en desarrollo (NODE_ENV !== "production") y sin clave secreta los
 * formularios funcionan sin captcha.
 *
 * Variables de entorno necesarias en producción:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  → clave pública (para el widget del cliente)
 *   TURNSTILE_SECRET_KEY            → clave secreta (solo servidor)
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5000;

export const TURNSTILE_UNAVAILABLE_ERROR =
  "No hemos podido verificar que no eres un robot. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.";

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY no configurada. Modo desarrollo: captcha desactivado.");
      return { success: true };
    }
    console.error("[Turnstile] Falta TURNSTILE_SECRET_KEY en producción: se rechazan los envíos.");
    return { success: false, error: TURNSTILE_UNAVAILABLE_ERROR };
  }

  // El token es obligatorio y Cloudflare los limita a 2048 caracteres
  if (!token || typeof token !== "string" || token.length > 2048) {
    return { success: false, error: "Verificación anti-bot requerida. Por favor, completa el captcha." };
  }

  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: "no-store",
    });

    const data = (await response.json()) as { success?: boolean };
    if (response.ok && data.success === true) {
      return { success: true };
    }

    return {
      success: false,
      error: "La verificación anti-bot ha fallado. Recarga la página e inténtalo de nuevo.",
    };
  } catch (err) {
    // Fallo cerrado: sin verificación no se acepta el envío.
    console.error("[Turnstile] Error al verificar token:", err instanceof Error ? err.name : err);
    return { success: false, error: TURNSTILE_UNAVAILABLE_ERROR };
  }
}
