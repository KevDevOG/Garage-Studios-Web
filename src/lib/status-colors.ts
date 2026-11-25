/**
 * Estados del panel de Garage Studios: etiqueta en castellano y tono.
 *
 * Un tono por significado, igual en todo el panel:
 *   amber   → espera una acción (reserva pendiente, cobro pendiente, mensaje nuevo)
 *   ok      → resuelto a favor (confirmada, pagado, ingreso)
 *   info    → informativo o intermedio (completada, pago parcial)
 *   bad     → anulado o salida de dinero (cancelada, gasto)
 *   neutral → sin carga (rechazada, leído, métodos de pago)
 */

export type StatusType =
  | 'reserva'
  | 'pago'
  | 'finanzas'
  | 'mensaje'
  | 'cliente';

export type StatusTone = 'amber' | 'ok' | 'info' | 'bad' | 'neutral';

export interface StatusConfig {
  label: string;
  tone: StatusTone;
  /** Clases de texto del tono, para quien pinte el estado sin <StatusBadge>. */
  colorClass: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  amber: 'text-gs-amber',
  ok: 'text-gs-ok',
  info: 'text-gs-info',
  bad: 'text-gs-bad',
  neutral: 'text-gs-soft',
};

const status = (label: string, tone: StatusTone): StatusConfig => ({
  label,
  tone,
  colorClass: TONE_CLASS[tone],
});

export const RESERVA_STATUS: Record<string, StatusConfig> = {
  pendiente: status('Pendiente', 'amber'),
  confirmada: status('Confirmada', 'ok'),
  cancelada: status('Cancelada', 'bad'),
  rechazada: status('Rechazada', 'neutral'),
  completada: status('Completada', 'info'),
};

export const PAGO_STATUS: Record<string, StatusConfig> = {
  // Estados de pago
  pendiente: status('Sin cobrar', 'amber'),
  parcial: status('Pago parcial', 'info'),
  pagado: status('Pagado', 'ok'),
  // Métodos de pago
  efectivo: status('Efectivo', 'neutral'),
  bizum: status('Bizum', 'neutral'),
  tarjeta: status('Tarjeta', 'neutral'),
  transferencia: status('Transferencia', 'neutral'),
  stripe: status('Stripe', 'neutral'),
  paypal: status('PayPal', 'neutral'),
};

export const FINANZAS_STATUS: Record<string, StatusConfig> = {
  ingreso: status('Ingreso', 'ok'),
  gasto: status('Gasto', 'bad'),
};

export const MENSAJE_STATUS: Record<string, StatusConfig> = {
  nuevo: status('Nuevo', 'amber'),
  leido: status('Leído', 'neutral'),
};

export const CLIENTE_STATUS: Record<string, StatusConfig> = {
  recurrente: status('Recurrente', 'amber'),
  nuevo: status('Nuevo', 'info'),
};

const TABLES: Record<StatusType, Record<string, StatusConfig>> = {
  reserva: RESERVA_STATUS,
  pago: PAGO_STATUS,
  finanzas: FINANZAS_STATUS,
  mensaje: MENSAJE_STATUS,
  cliente: CLIENTE_STATUS,
};

export function getStatusConfig(type: StatusType, value: string): StatusConfig {
  const normalized = value?.toLowerCase();
  return TABLES[type]?.[normalized] ?? status(value, 'neutral');
}
