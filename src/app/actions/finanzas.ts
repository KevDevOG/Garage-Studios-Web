"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { compareIsoDates, getZonedParts, isValidIsoDate, monthRange } from "@/lib/dates";

export interface FinanceMovement {
  id: string;
  tipo: "ingreso" | "gasto";
  categoria: string;
  concepto: string;
  descripcion: string | null;
  importe: number;
  fecha: string;
  metodo_pago: string | null;
  reserva_id: string | null;
  cliente_id: string | null;
  servicio_id: string | null;
  recurrente: boolean;
  notas: string | null;
  created_at: string;
}

// ── Tipos internos ────────────────────────────────────────────

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface NamedRef {
  nombre: string | null;
}

interface MovementRow extends FinanceMovement {
  servicio: NamedRef | null;
  cliente: NamedRef | null;
}

interface ReservationRow {
  id: string;
  nombre: string | null;
  importe_pagado: number | string | null;
  fecha_reserva: string;
  created_at: string;
  servicio: NamedRef | null;
  cliente: NamedRef | null;
}

interface FinanceData {
  /** Movimientos manuales que cuentan (sin ingresos ligados a reserva). */
  movements: MovementRow[];
  /** Reservas con cobro (parcial/pagado) no canceladas ni rechazadas. */
  reservations: ReservationRow[];
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METODOS_PAGO = ["efectivo", "transferencia", "tarjeta", "bizum", "otro"] as const;
const MAX_IMPORTE = 99_999_999.99; // NUMERIC(10,2)

// ── Helpers de lectura ────────────────────────────────────────

/** PostgREST corta en 1000 filas: pagina con .range() hasta agotar. */
async function fetchAllRows<T>(
  label: string,
  run: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<T[] | null> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await run(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(`[finanzas] Error consultando ${label}:`, error.message);
      return null;
    }
    const chunk = (data ?? []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return rows;
}

/**
 * Lee, una sola vez, los movimientos manuales y los cobros de reservas de un
 * rango de fechas (YYYY-MM-DD, ambos incluidos). Devuelve null si falla alguna
 * de las dos consultas.
 *
 * Regla de negocio: un ingreso manual con reserva_id se excluye para no
 * duplicar el cobro que ya aporta la propia reserva.
 */
async function fetchFinanceData(
  supabase: SupabaseServerClient,
  start: string,
  end: string
): Promise<FinanceData | null> {
  const [movements, reservations] = await Promise.all([
    fetchAllRows<MovementRow>("finanza_movimiento", (from, to) =>
      supabase
        .from("finanza_movimiento")
        .select(
          "id, tipo, categoria, concepto, descripcion, importe, fecha, metodo_pago, reserva_id, cliente_id, servicio_id, recurrente, notas, created_at, servicio:servicio_id(nombre), cliente:cliente_id(nombre)"
        )
        .gte("fecha", start)
        .lte("fecha", end)
        .is("deleted_at", null)
        .order("fecha", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    fetchAllRows<ReservationRow>("reserva", (from, to) =>
      supabase
        .from("reserva")
        .select("id, nombre, importe_pagado, fecha_reserva, created_at, servicio:servicio_id(nombre), cliente:cliente_id(nombre)")
        .gte("fecha_reserva", start)
        .lte("fecha_reserva", end)
        .in("estado_pago", ["parcial", "pagado"])
        .not("estado", "in", "(cancelada,rechazada)")
        .gt("importe_pagado", 0)
        .is("deleted_at", null)
        .order("fecha_reserva", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);

  if (!movements || !reservations) return null;

  return {
    movements: movements.filter((m) => !(m.tipo === "ingreso" && m.reserva_id)),
    reservations,
  };
}

async function requireUser(supabase: SupabaseServerClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

function monthIndex(isoDate: string | null | undefined): number {
  const month = Number.parseInt((isoDate ?? "").slice(5, 7), 10);
  return Number.isFinite(month) ? month - 1 : -1;
}

function toAmount(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ── Resumen mensual ───────────────────────────────────────────

export async function getFinanceSummary(month: number, year: number) {
  const supabase = await createClient();
  await requireUser(supabase);

  const empty = { ingresos: 0, gastos: 0, beneficio: 0, count: 0, ticketMedio: 0 };
  const { start, end } = monthRange(year, month);
  const data = await fetchFinanceData(supabase, start, end);
  if (!data) return empty;

  let ingresos = 0;
  let gastos = 0;
  let numIngresos = 0;

  for (const mov of data.movements) {
    if (mov.tipo === "gasto") {
      gastos += toAmount(mov.importe);
    } else if (mov.tipo === "ingreso") {
      ingresos += toAmount(mov.importe);
      numIngresos++;
    }
  }
  for (const res of data.reservations) {
    ingresos += toAmount(res.importe_pagado);
    numIngresos++;
  }

  return {
    ingresos,
    gastos,
    beneficio: ingresos - gastos,
    count: data.movements.length + data.reservations.length,
    ticketMedio: numIngresos > 0 ? ingresos / numIngresos : 0,
  };
}

export async function getFinanceMovements(month: number, year: number): Promise<FinanceMovement[]> {
  const supabase = await createClient();
  await requireUser(supabase);

  const { start, end } = monthRange(year, month);
  const data = await fetchFinanceData(supabase, start, end);
  if (!data) return [];

  const manual: FinanceMovement[] = data.movements.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    categoria: m.categoria,
    concepto: m.concepto,
    descripcion: m.descripcion,
    importe: toAmount(m.importe),
    fecha: m.fecha,
    metodo_pago: m.metodo_pago,
    reserva_id: m.reserva_id,
    cliente_id: m.cliente_id,
    servicio_id: m.servicio_id,
    recurrente: m.recurrente,
    notas: m.notas,
    created_at: m.created_at,
  }));

  const fromReservations: FinanceMovement[] = data.reservations.map((res) => ({
    id: `reserva-${res.id}`,
    tipo: "ingreso",
    categoria: res.servicio?.nombre || "Reserva",
    concepto: `Reserva - ${res.nombre ?? "Sin nombre"}`,
    descripcion: null,
    importe: toAmount(res.importe_pagado),
    fecha: res.fecha_reserva,
    metodo_pago: "Cobro Reserva",
    reserva_id: res.id,
    cliente_id: null,
    servicio_id: null,
    recurrente: false,
    notas: "Pago automático desde reserva",
    created_at: res.created_at,
  }));

  // Orden: fecha desc y, a igual fecha, creación desc.
  return [...manual, ...fromReservations].sort((a, b) => {
    const byDate = compareIsoDates(b.fecha, a.fecha);
    if (byDate !== 0) return byDate;
    return compareIsoDates(b.created_at ?? "", a.created_at ?? "");
  });
}

// ── Validación de escritura ───────────────────────────────────

interface MovementInput {
  tipo: "ingreso" | "gasto";
  categoria: string;
  concepto: string;
  descripcion: string | null;
  importe: number;
  fecha: string;
  metodo_pago: string | null;
  reserva_id: string | null;
  cliente_id: string | null;
  servicio_id: string | null;
  notas: string | null;
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseMovementForm(
  formData: FormData
): { ok: true; value: MovementInput } | { ok: false; error: string } {
  const tipo = readText(formData, "tipo");
  if (tipo !== "ingreso" && tipo !== "gasto") {
    return { ok: false, error: "El tipo debe ser ingreso o gasto." };
  }

  const importeRaw = readText(formData, "importe").replace(",", ".");
  const importe = importeRaw === "" ? NaN : Number(importeRaw);
  if (!Number.isFinite(importe) || importe <= 0) {
    return { ok: false, error: "El importe debe ser un número mayor que 0." };
  }
  if (importe > MAX_IMPORTE) {
    return { ok: false, error: "El importe es demasiado grande." };
  }

  const fecha = readText(formData, "fecha");
  if (!isValidIsoDate(fecha)) {
    return { ok: false, error: "La fecha no es válida." };
  }

  const concepto = readText(formData, "concepto");
  if (!concepto) return { ok: false, error: "El concepto es obligatorio." };
  if (concepto.length > 120) return { ok: false, error: "El concepto no puede superar los 120 caracteres." };

  const categoria = readText(formData, "categoria");
  if (!categoria) return { ok: false, error: "La categoría es obligatoria." };
  if (categoria.length > 60) return { ok: false, error: "La categoría no puede superar los 60 caracteres." };

  const metodoRaw = readText(formData, "metodo_pago");
  if (metodoRaw && !(METODOS_PAGO as readonly string[]).includes(metodoRaw)) {
    return { ok: false, error: "El método de pago no es válido." };
  }

  const ids: Record<"reserva_id" | "cliente_id" | "servicio_id", string | null> = {
    reserva_id: null,
    cliente_id: null,
    servicio_id: null,
  };
  for (const key of ["reserva_id", "cliente_id", "servicio_id"] as const) {
    const raw = readText(formData, key);
    if (raw && !UUID_RE.test(raw)) {
      return { ok: false, error: "Alguna de las referencias (reserva, cliente o servicio) no es válida." };
    }
    ids[key] = raw || null;
  }

  const descripcion = readText(formData, "descripcion") || null;
  const notas = readText(formData, "notas") || null;
  if ((descripcion?.length ?? 0) > 1000 || (notas?.length ?? 0) > 1000) {
    return { ok: false, error: "Las notas no pueden superar los 1000 caracteres." };
  }

  return {
    ok: true,
    value: {
      tipo,
      categoria,
      concepto,
      descripcion,
      importe: Math.round(importe * 100) / 100,
      fecha,
      metodo_pago: metodoRaw || null,
      ...ids,
      notas,
    },
  };
}

// ── Escritura ─────────────────────────────────────────────────

export async function createFinanceMovement(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return actionError("No autorizado");

  const parsed = parseMovementForm(formData);
  if (!parsed.ok) return actionError(parsed.error);
  const mov = parsed.value;

  const { error } = await supabase.from("finanza_movimiento").insert(mov);

  if (error) {
    console.error("[finanzas] Error creando movimiento:", error.message);
    return actionError("No se pudo guardar el movimiento. Inténtalo de nuevo.");
  }

  await createAuditLog({
    accion: "creación",
    entidad: "finanza",
    descripcion: `Movimiento ${mov.tipo}: ${mov.concepto} (${mov.importe}€)`,
    metadata: { tipo: mov.tipo, categoria: mov.categoria, importe: mov.importe, reserva_id: mov.reserva_id || undefined },
  });

  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/dashboard");
  return actionOk();
}

export async function updateFinanceMovement(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return actionError("No autorizado");

  if (!UUID_RE.test(id)) return actionError("Movimiento no válido.");

  const parsed = parseMovementForm(formData);
  if (!parsed.ok) return actionError(parsed.error);
  const mov = parsed.value;

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .update({ ...mov, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[finanzas] Error actualizando movimiento:", error.message);
    return actionError("No se pudo actualizar el movimiento. Inténtalo de nuevo.");
  }
  if (!data || data.length === 0) {
    return actionError("El movimiento no existe o ya fue eliminado.");
  }

  await createAuditLog({
    accion: "edición",
    entidad: "finanza",
    entidad_id: id,
    descripcion: `Movimiento editado: ${mov.concepto} (${mov.importe}€)`,
    metadata: { tipo: mov.tipo, categoria: mov.categoria, importe: mov.importe },
  });

  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/dashboard");
  return actionOk();
}

export async function deleteFinanceMovement(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return actionError("No autorizado");

  if (!UUID_RE.test(id)) return actionError("Movimiento no válido.");

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[finanzas] Error eliminando movimiento:", error.message);
    return actionError("No se pudo eliminar el movimiento. Inténtalo de nuevo.");
  }
  if (!data || data.length === 0) {
    return actionError("El movimiento no existe o ya fue eliminado.");
  }

  await createAuditLog({
    accion: "eliminación",
    entidad: "finanza",
    entidad_id: id,
    descripcion: `Movimiento ${id.slice(0, 8)}… eliminado (borrado lógico)`,
  });

  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/dashboard");
  return actionOk();
}

export async function checkFinanceMovementExistsForReservation(reserva_id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("id")
    .eq("reserva_id", reserva_id)
    .is("deleted_at", null)
    .limit(1);

  if (error || !data) return false;
  return data.length > 0;
}

/**
 * Obtiene reservas confirmadas o completadas que tienen pagos pendientes o parciales
 */
export async function getPendingPaymentReservations() {
  const supabase = await createClient();
  await requireUser(supabase);

  const { data: reservas, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .in("estado", ["confirmada", "completada"])
    .in("estado_pago", ["pendiente", "parcial"])
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: false });

  if (error) {
    console.error("[finanzas] Error consultando pagos pendientes:", error.message);
    return [];
  }

  return reservas ?? [];
}

// ── Vista anual ───────────────────────────────────────────────

export interface FinanceMonthStat {
  mes: number;
  ingresos: number;
  gastos: number;
  beneficio: number;
}

export interface FinanceYearlySummary {
  ingresosTotal: number;
  gastosTotal: number;
  beneficioTotal: number;
  movimientosCount: number;
  ticketMedio: number;
  evolution: FinanceMonthStat[];
  /** Mes con más ingresos, o null si el año no tiene ingresos. */
  bestMonth: FinanceMonthStat | null;
  /** Mes con menos ingresos (>0), o null si el año no tiene ingresos. */
  worstMonth: FinanceMonthStat | null;
}

export type FinanceTopEntry = [string, number] | null;

export interface FinanceAnnualInsights {
  topService: FinanceTopEntry;
  topSpendingCategory: FinanceTopEntry;
  topClient: FinanceTopEntry;
  mostUsedPaymentMethod: FinanceTopEntry;
}

function emptyYearOverview(): { summary: FinanceYearlySummary; insights: FinanceAnnualInsights } {
  return {
    summary: {
      ingresosTotal: 0,
      gastosTotal: 0,
      beneficioTotal: 0,
      movimientosCount: 0,
      ticketMedio: 0,
      evolution: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, ingresos: 0, gastos: 0, beneficio: 0 })),
      bestMonth: null,
      worstMonth: null,
    },
    insights: { topService: null, topSpendingCategory: null, topClient: null, mostUsedPaymentMethod: null },
  };
}

function getTop(obj: Record<string, number>): FinanceTopEntry {
  const entries = Object.entries(obj);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

/**
 * Resumen financiero e insights de un año completo, calculados con una
 * única lectura de datos.
 */
export async function getFinanceYearOverview(year: number) {
  const supabase = await createClient();
  await requireUser(supabase);

  const overview = emptyYearOverview();
  const { start, end } = monthRange(year, null);
  const data = await fetchFinanceData(supabase, start, end);
  if (!data) return overview;

  const { summary } = overview;
  let numIngresos = 0;

  const serviceStats: Record<string, number> = {};
  const categorySpending: Record<string, number> = {};
  const clientValue: Record<string, number> = {};
  const paymentMethods: Record<string, number> = {};

  for (const mov of data.movements) {
    const month = summary.evolution[monthIndex(mov.fecha)];
    if (!month) continue;
    const amount = toAmount(mov.importe);

    if (mov.tipo === "gasto") {
      summary.gastosTotal += amount;
      month.gastos += amount;
      categorySpending[mov.categoria] = (categorySpending[mov.categoria] || 0) + amount;
    } else if (mov.tipo === "ingreso") {
      summary.ingresosTotal += amount;
      month.ingresos += amount;
      numIngresos++;
      if (mov.servicio?.nombre) {
        serviceStats[mov.servicio.nombre] = (serviceStats[mov.servicio.nombre] || 0) + amount;
      }
      if (mov.cliente?.nombre) {
        clientValue[mov.cliente.nombre] = (clientValue[mov.cliente.nombre] || 0) + amount;
      }
    }
    summary.movimientosCount++;

    if (mov.metodo_pago) {
      paymentMethods[mov.metodo_pago] = (paymentMethods[mov.metodo_pago] || 0) + 1;
    }
  }

  for (const res of data.reservations) {
    const month = summary.evolution[monthIndex(res.fecha_reserva)];
    if (!month) continue;
    const amount = toAmount(res.importe_pagado);

    summary.ingresosTotal += amount;
    month.ingresos += amount;
    numIngresos++;
    summary.movimientosCount++;

    const sName = res.servicio?.nombre || "Reserva";
    const cName = res.cliente?.nombre || "Desconocido";
    serviceStats[sName] = (serviceStats[sName] || 0) + amount;
    clientValue[cName] = (clientValue[cName] || 0) + amount;
    paymentMethods["Cobro Reserva"] = (paymentMethods["Cobro Reserva"] || 0) + 1;
  }

  for (const m of summary.evolution) m.beneficio = m.ingresos - m.gastos;

  const withIncome = summary.evolution.filter((m) => m.ingresos > 0);
  summary.bestMonth = withIncome.length
    ? withIncome.reduce((prev, cur) => (cur.ingresos > prev.ingresos ? cur : prev))
    : null;
  summary.worstMonth = withIncome.length
    ? withIncome.reduce((prev, cur) => (cur.ingresos < prev.ingresos ? cur : prev))
    : null;
  summary.beneficioTotal = summary.ingresosTotal - summary.gastosTotal;
  summary.ticketMedio = numIngresos > 0 ? summary.ingresosTotal / numIngresos : 0;

  return {
    summary,
    insights: {
      topService: getTop(serviceStats),
      topSpendingCategory: getTop(categorySpending),
      topClient: getTop(clientValue),
      mostUsedPaymentMethod: getTop(paymentMethods),
    },
  };
}

/**
 * Obtiene los ingresos reales del mes actual
 */
export async function getMonthlyRevenue() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { year, month } = getZonedParts();
  const { start, end } = monthRange(year, month);
  const data = await fetchFinanceData(supabase, start, end);
  if (!data) return 0;

  const manual = data.movements
    .filter((m) => m.tipo === "ingreso")
    .reduce((sum, m) => sum + toAmount(m.importe), 0);
  const reservas = data.reservations.reduce((sum, r) => sum + toAmount(r.importe_pagado), 0);

  return manual + reservas;
}
