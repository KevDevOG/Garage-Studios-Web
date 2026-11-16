"use server";

import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";
import { createAuditLog } from "@/lib/audit";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { formatDateTimeEs, todayInStudio } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";

export type ExportType = "reservas" | "clientes" | "finanzas" | "contactos" | "servicios";

const EXPORT_TYPES: readonly ExportType[] = ["reservas", "clientes", "finanzas", "contactos", "servicios"];

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

type Row = Record<string, unknown>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface ExportConfig {
  columns: { header: string; key: string; width: number }[];
  table: string;
  select: string;
  /** Orden principal; se añade `id` como desempate para paginar de forma estable. */
  order: { column: string; ascending: boolean };
  /** Tablas con borrado lógico: se excluyen las filas con deleted_at. */
  softDelete: boolean;
  toRow: (r: Row) => Row;
}

/**
 * Neutraliza la inyección de fórmulas en Excel/CSV: cualquier texto que
 * empiece por = + - @ (o tabulador / retorno de carro) se antepone con un
 * apóstrofo para que se interprete como texto.
 */
function safeCell(value: unknown): unknown {
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function safeRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) out[key] = safeCell(value);
  return out;
}

const text = (v: unknown): string => (v === null || v === undefined || v === "" ? "—" : String(v));

const CONFIGS: Record<ExportType, ExportConfig> = {
  reservas: {
    columns: [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora Inicio", key: "hora_inicio", width: 12 },
      { header: "Hora Fin", key: "hora_fin", width: 12 },
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Teléfono", key: "telefono", width: 15 },
      { header: "Servicio", key: "servicio", width: 20 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Estado Pago", key: "estado_pago", width: 12 },
      { header: "Importe Pagado", key: "importe_pagado", width: 15 },
      { header: "Origen", key: "origen", width: 12 },
    ],
    table: "reserva",
    select:
      "fecha_reserva, hora_inicio, hora_fin, nombre, email, telefono, estado, estado_pago, importe_pagado, origen, servicio(nombre)",
    order: { column: "fecha_reserva", ascending: false },
    softDelete: true,
    toRow: (r) => ({
      fecha: r.fecha_reserva,
      hora_inicio: formatTime(r.hora_inicio as string | null),
      hora_fin: formatTime(r.hora_fin as string | null),
      nombre: r.nombre,
      email: r.email,
      telefono: r.telefono,
      servicio: (r.servicio as { nombre?: string } | null)?.nombre || "—",
      estado: r.estado,
      estado_pago: r.estado_pago,
      importe_pagado: r.importe_pagado,
      origen: r.origen,
    }),
  },
  clientes: {
    columns: [
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Teléfono", key: "telefono", width: 15 },
      { header: "Instagram", key: "instagram", width: 20 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Origen", key: "origen", width: 12 },
      { header: "Etiquetas", key: "etiquetas", width: 30 },
      { header: "Total Reservas", key: "total_reservas", width: 15 },
      { header: "Total Pagado", key: "importe_total", width: 15 },
      { header: "Última Reserva", key: "ultima_reserva_fecha", width: 15 },
    ],
    table: "cliente",
    select: "nombre, email, telefono, instagram, estado, origen, etiquetas, total_reservas, importe_total, ultima_reserva_fecha",
    order: { column: "nombre", ascending: true },
    softDelete: false,
    toRow: (r) => ({
      nombre: r.nombre,
      email: r.email,
      telefono: r.telefono,
      instagram: text(r.instagram),
      estado: r.estado,
      origen: r.origen,
      etiquetas: Array.isArray(r.etiquetas) && r.etiquetas.length > 0 ? r.etiquetas.join(", ") : "—",
      total_reservas: r.total_reservas,
      importe_total: r.importe_total,
      ultima_reserva_fecha: text(r.ultima_reserva_fecha),
    }),
  },
  finanzas: {
    columns: [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Concepto", key: "concepto", width: 30 },
      { header: "Importe", key: "importe", width: 12 },
      { header: "Método Pago", key: "metodo_pago", width: 15 },
      { header: "Notas", key: "notas", width: 30 },
    ],
    table: "finanza_movimiento",
    select: "fecha, tipo, categoria, concepto, importe, metodo_pago, notas",
    order: { column: "fecha", ascending: false },
    softDelete: true,
    toRow: (r) => ({
      fecha: r.fecha,
      tipo: r.tipo,
      categoria: r.categoria,
      concepto: r.concepto,
      importe: r.importe,
      metodo_pago: r.metodo_pago,
      notas: text(r.notas),
    }),
  },
  contactos: {
    columns: [
      { header: "Fecha", key: "fecha", width: 20 },
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Teléfono", key: "telefono", width: 15 },
      { header: "Mensaje", key: "mensaje", width: 50 },
      { header: "Leído", key: "leido", width: 10 },
    ],
    table: "contacto",
    select: "created_at, nombre, email, telefono, mensaje, leido",
    order: { column: "created_at", ascending: false },
    softDelete: false,
    toRow: (r) => ({
      fecha: typeof r.created_at === "string" ? formatDateTimeEs(r.created_at) : "—",
      nombre: r.nombre,
      email: r.email,
      telefono: r.telefono,
      mensaje: r.mensaje,
      leido: r.leido ? "SÍ" : "NO",
    }),
  },
  servicios: {
    columns: [
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Precio", key: "precio", width: 12 },
      { header: "Duración (min)", key: "duracion", width: 15 },
      { header: "Activo", key: "activo", width: 10 },
      { header: "Orden", key: "orden", width: 10 },
    ],
    table: "servicio",
    select: "nombre, descripcion, precio, duracion_minutos, activo, orden",
    order: { column: "orden", ascending: true },
    softDelete: false,
    toRow: (r) => ({
      nombre: r.nombre,
      descripcion: r.descripcion,
      precio: r.precio,
      duracion: r.duracion_minutos,
      activo: r.activo ? "SÍ" : "NO",
      orden: r.orden,
    }),
  },
};

/** PostgREST corta en 1000 filas: pagina con .range() hasta agotar. */
async function fetchAll(
  supabase: SupabaseServerClient,
  config: ExportConfig
): Promise<{ rows: Row[] } | { error: string }> {
  const rows: Row[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    let query = supabase.from(config.table).select(config.select);
    if (config.softDelete) query = query.is("deleted_at", null);
    const { data, error } = await query
      .order(config.order.column, { ascending: config.order.ascending })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`[exportaciones] Error consultando ${config.table}:`, error.message);
      return { error: "No se pudieron leer los datos para la exportación." };
    }
    const chunk = (data ?? []) as unknown as Row[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return { rows };
  }
  return { error: "La exportación supera el límite de filas permitido." };
}

export async function exportToExcel(
  type: ExportType
): Promise<ActionResult<{ buffer: string; filename: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return actionError("No autorizado");

  if (typeof type !== "string" || !EXPORT_TYPES.includes(type)) {
    return actionError("Tipo de exportación no válido.");
  }

  const config = CONFIGS[type];
  const result = await fetchAll(supabase, config);
  if ("error" in result) return actionError(result.error);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(type.toUpperCase());
  worksheet.columns = config.columns;
  for (const row of result.rows) {
    worksheet.addRow(safeRow(config.toRow(row)));
  }

  // Estilo de cabecera
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEEEEE" },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  // Auditoría
  await createAuditLog({
    accion: "exportación",
    entidad: type,
    descripcion: `Exportación de ${type} a Excel generada (${result.rows.length} filas)`,
  });

  return actionOk({
    buffer: Buffer.from(buffer).toString("base64"),
    filename: `${type}_${todayInStudio()}.xlsx`,
  });
}
