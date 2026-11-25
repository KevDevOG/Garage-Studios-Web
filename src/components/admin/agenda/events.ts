import type { ReservationRow } from "@/app/actions/calendario";
import { endMinutes, startMinutes, type AgendaEvent, type AgendaTone } from "@/lib/agenda";
import { RESERVA_STATUS } from "@/lib/status-colors";

/** Lo que necesita una fila de sesión: un subconjunto de la reserva. */
export type SessionRowData = Pick<
  ReservationRow,
  "id" | "nombre" | "estado" | "fecha_reserva" | "hora_inicio" | "hora_fin" | "precio"
> &
  Partial<
    Pick<
      ReservationRow,
      | "email"
      | "telefono"
      | "cliente_total_reservas"
      | "is_block"
      | "block_title"
      | "parent_reserva_id"
      | "estado_pago"
      | "importe_pagado"
      | "servicio"
    >
  >;

export interface ManualBlock {
  id: string;
  motivo: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
}

/** Columnas de `reserva` que pinta una fila de sesión. */
export const SESSION_SELECT =
  "id, nombre, email, telefono, estado, fecha_reserva, hora_inicio, hora_fin, precio, estado_pago, importe_pagado, servicio(nombre), cliente:cliente_id(total_reservas)";

/** Bloque de un pack (`reserva_bloque`) con los datos de su reserva. */
export const PACK_BLOCK_SELECT =
  "id, reserva_id, titulo, fecha, hora_inicio, hora_fin, duracion_minutos, estado, reserva:reserva_id(id, servicio_id, nombre, email, telefono, precio, estado_pago, importe_pagado, deleted_at, servicio(nombre), cliente:cliente_id(total_reservas))";

export interface PackBlockRow {
  id: string;
  reserva_id: string;
  titulo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number | null;
  estado: string;
  reserva: {
    id: string;
    servicio_id: string | null;
    nombre: string | null;
    email: string | null;
    telefono: string | null;
    precio: number | null;
    estado_pago: ReservationRow["estado_pago"];
    importe_pagado: number | null;
    deleted_at: string | null;
    servicio: { nombre: string } | null;
    cliente: { total_reservas: number | null } | null;
  } | null;
}

/**
 * Filas de sesión a partir de los bloques de pack: heredan de la reserva
 * padre el cliente, el precio y el pago. Se descartan los de reservas borradas.
 */
export function packBlocksToRows(blocks: PackBlockRow[]): SessionRowData[] {
  return blocks
    .filter((b) => b.reserva && !b.reserva.deleted_at)
    .map((b) => {
      const parent = b.reserva!;
      return {
        id: b.id,
        nombre: parent.nombre || "Bloque de tiempo",
        email: parent.email ?? "",
        telefono: parent.telefono ?? "",
        fecha_reserva: b.fecha,
        hora_inicio: b.hora_inicio,
        hora_fin: b.hora_fin,
        estado: b.estado,
        precio: parent.precio ?? null,
        cliente_total_reservas: parent.cliente?.total_reservas ?? undefined,
        servicio: parent.servicio,
        estado_pago: parent.estado_pago,
        importe_pagado: parent.importe_pagado ?? undefined,
        is_block: true,
        block_title: b.titulo,
        parent_reserva_id: b.reserva_id,
      };
    });
}

/**
 * Las consultas traen el total de reservas del cliente anidado
 * (`cliente: { total_reservas }`); la fila lo espera en `cliente_total_reservas`.
 */
export function withClienteStats<T extends SessionRowData>(
  row: T & { cliente?: { total_reservas: number | null } | null },
): T {
  if (row.cliente_total_reservas !== undefined) return row;
  return { ...row, cliente_total_reservas: row.cliente?.total_reservas ?? undefined };
}

/** Importe que falta por cobrar de una reserva (nunca negativo). */
export function amountDue(row: { precio?: number | null; importe_pagado?: number | null }): number {
  return Math.max(Number(row.precio ?? 0) - Number(row.importe_pagado ?? 0), 0);
}

/** Estados que dejan libre el hueco de la agenda. */
export function occupiesSlot(estado: string): boolean {
  return estado !== "cancelada" && estado !== "rechazada";
}

export function reservationToEvent(r: SessionRowData): AgendaEvent {
  const status = RESERVA_STATUS[r.estado];
  return {
    id: r.id,
    kind: r.is_block ? "pack" : "reserva",
    fecha: r.fecha_reserva,
    start: startMinutes(r.hora_inicio),
    end: endMinutes(r.hora_fin),
    title: r.nombre,
    subtitle: r.is_block ? r.block_title || "Sesión de pack" : r.servicio?.nombre ?? null,
    statusLabel: status?.label ?? r.estado,
    tone: (status?.tone ?? "neutral") as AgendaTone,
    href: r.is_block
      ? r.parent_reserva_id
        ? `/admin/calendario/${r.parent_reserva_id}`
        : null
      : `/admin/calendario/${r.id}`,
    occupies: occupiesSlot(r.estado),
  };
}

export function manualBlockToEvent(b: ManualBlock): AgendaEvent {
  return {
    id: `bloqueo-${b.id}`,
    kind: "bloqueo",
    fecha: b.fecha,
    start: startMinutes(b.hora_inicio),
    end: endMinutes(b.hora_fin),
    title: b.motivo || "Horas bloqueadas",
    subtitle: null,
    statusLabel: "Bloqueo",
    tone: "neutral",
    href: `/admin/calendario?view=dia&fecha=${b.fecha}`,
    occupies: true,
  };
}

/** Clases del "clip" de una sesión en pistas y rejillas, según su tono. */
export const CLIP_TONE: Record<AgendaTone, string> = {
  amber: "border-gs-amber bg-gs-amber/15 hover:bg-gs-amber/25",
  ok: "border-gs-ok bg-gs-ok/15 hover:bg-gs-ok/25",
  info: "border-gs-info bg-gs-info/15 hover:bg-gs-info/25",
  bad: "border-gs-bad bg-gs-bad/15 hover:bg-gs-bad/25",
  neutral: "border-[#6f7277] bg-white/[0.06] hover:bg-white/[0.1]",
};

/** Las horas bloqueadas se distinguen por la trama, no por el color. */
export const CLIP_BLOCKED = "gs-hatch border-[#6f7277] bg-gs-raised text-gs-soft hover:bg-[#212328]";

export function clipClass(event: Pick<AgendaEvent, "kind" | "tone">): string {
  return event.kind === "bloqueo" ? CLIP_BLOCKED : CLIP_TONE[event.tone];
}

/** Color sólido del tono, para la pista mínima. */
export const CLIP_SOLID: Record<AgendaTone, string> = {
  amber: "bg-gs-amber",
  ok: "bg-gs-ok",
  info: "bg-gs-info",
  bad: "bg-gs-bad",
  neutral: "bg-[#6f7277]",
};
