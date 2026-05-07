/**
 * Cloudflare Turnstile — Verificación server-side
 *
 * En desarrollo (sin variables de entorno): los formularios funcionan sin captcha.
 * En producción (con variables): el captcha es obligatorio.
 *
 * Variables de entorno necesarias en producción:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  → clave pública (para el widget del cliente)
 *   TURNSTILE_SECRET_KEY            → clave secreta (solo servidor)
 *
 * Obtenerlas en: https://dash.cloudflare.com → Turnstile → Add Site
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string | null | undefined): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Modo desarrollo: si no hay clave secreta, permitir todo con aviso
  if (!secretKey) {
    console.warn("[Turnstile] ⚠️ TURNSTILE_SECRET_KEY no configurada. Modo desarrollo: captcha desactivado.");
    return { success: true };
  }

  // En producción, el token es obligatorio
  if (!token) {
    return { success: false, error: "Verificación anti-bot requerida. Por favor, completa el captcha." };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "La verificación anti-bot ha fallado. Recarga la página e inténtalo de nuevo.",
    };
  } catch (err) {
    console.error("[Turnstile] Error al verificar token:", err);
    // Si Turnstile está caído, no bloquear al usuario
    return { success: true };
  }
}
