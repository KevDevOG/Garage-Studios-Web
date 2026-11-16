// ── Contrato de resultado para Server Actions ─────────────────
// En producción Next.js NO reenvía al navegador el mensaje de un
// `throw new Error("…")` lanzado dentro de una Server Action: el cliente
// recibe un texto genérico con un `digest`. Por eso los errores esperados
// (validación, horario ocupado, límite de envíos…) deben devolverse como
// valor, nunca lanzarse.

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

export function actionOk(): ActionResult<undefined>;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data } as ActionResult<T | undefined>;
}

export function actionError(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Extrae un mensaje legible de un error desconocido sin exponer detalles
 * internos. Pensado para los `catch` de los componentes cliente.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && !/digest|Server Components|server action/i.test(err.message)) {
    return err.message;
  }
  return fallback;
}
