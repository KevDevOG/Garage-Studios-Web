/**
 * Estandarización de colores para estados en Garage Studios
 */

export type StatusType = 
  | 'reserva' 
  | 'pago' 
  | 'finanzas' 
  | 'mensaje'
  | 'cliente';

export interface StatusConfig {
  label: string;
  colorClass: string; // Tailwind bg/text classes
}

export const RESERVA_STATUS: Record<string, StatusConfig> = {
  pendiente: { label: 'Pendiente', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmada: { label: 'Confirmada', colorClass: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelada: { label: 'Cancelada', colorClass: 'bg-red-500/10 text-red-400 border-red-500/20' },
  rechazada: { label: 'Rechazada', colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  completada: { label: 'Completada', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export const PAGO_STATUS: Record<string, StatusConfig> = {
  // Estados de pago
  pendiente: { label: 'Pendiente', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  parcial: { label: 'Pago Parcial', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  pagado: { label: 'Pagado', colorClass: 'bg-green-500/10 text-green-400 border-green-500/20' },
  // Métodos de pago
  efectivo: { label: 'Efectivo', colorClass: 'bg-zinc-100/10 text-zinc-300 border-zinc-500/20' },
  bizum: { label: 'Bizum', colorClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  tarjeta: { label: 'Tarjeta', colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  transferencia: { label: 'Transferencia', colorClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  stripe: { label: 'Stripe', colorClass: 'bg-blue-600/10 text-blue-500 border-blue-600/20' },
  paypal: { label: 'PayPal', colorClass: 'bg-blue-800/10 text-blue-400 border-blue-800/20' },
};

export const FINANZAS_STATUS: Record<string, StatusConfig> = {
  ingreso: { label: 'Ingreso', colorClass: 'bg-green-500/10 text-green-400 border-green-500/20' },
  gasto: { label: 'Gasto', colorClass: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export const MENSAJE_STATUS: Record<string, StatusConfig> = {
  nuevo: { label: 'Nuevo', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  leido: { label: 'Leído', colorClass: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
};

export const CLIENTE_STATUS: Record<string, StatusConfig> = {
  recurrente: { label: 'Recurrente', colorClass: 'bg-accent/10 text-accent border-accent/20' },
  nuevo: { label: 'Nuevo', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export function getStatusConfig(type: StatusType, value: string): StatusConfig {
  const normalized = value?.toLowerCase();
  
  switch (type) {
    case 'reserva': return RESERVA_STATUS[normalized] || { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    case 'pago': return PAGO_STATUS[normalized] || { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    case 'finanzas': return FINANZAS_STATUS[normalized] || { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    case 'mensaje': return MENSAJE_STATUS[normalized] || { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    case 'cliente': return CLIENTE_STATUS[normalized] || { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    default: return { label: value, colorClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  }
}
