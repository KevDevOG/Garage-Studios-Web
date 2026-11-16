// ── Estados de reserva y de pago ──────────────────────────────
// Fuente única para servidor y cliente (los archivos "use server" solo pueden
// exportar funciones async, por eso viven aquí).

export const RESERVATION_STATES = ["pendiente", "confirmada", "cancelada", "rechazada", "completada"] as const;
export type ReservationState = (typeof RESERVATION_STATES)[number];

export const PAYMENT_STATES = ["pendiente", "parcial", "pagado"] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

/** Estados que ocupan hueco en la agenda (coinciden con el EXCLUDE de la BD). */
export const ACTIVE_RESERVATION_STATES: readonly ReservationState[] = ["pendiente", "confirmada"];

export function isReservationState(value: string): value is ReservationState {
  return (RESERVATION_STATES as readonly string[]).includes(value);
}

export function isPaymentState(value: string): value is PaymentState {
  return (PAYMENT_STATES as readonly string[]).includes(value);
}
