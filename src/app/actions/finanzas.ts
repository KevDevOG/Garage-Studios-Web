"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";

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

export async function getFinanceSummary(month: number, year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // 1. Gastos y otros ingresos manuales (sin reserva_id)
  const { data: movements, error: movError } = await supabase
    .from("finanza_movimiento")
    .select("tipo, importe, reserva_id")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (movError) throw new Error(movError.message);

  // 2. Ingresos automáticos de reservas
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("importe_pagado")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .gt("importe_pagado", 0)
    .is("deleted_at", null);

  if (resError) throw new Error(resError.message);

  let ingresos = 0;
  let gastos = 0;
  let count = (movements?.length || 0) + (reservations?.length || 0);

  // Procesar movimientos manuales
  movements?.forEach(mov => {
    if (mov.tipo === "gasto") {
      gastos += Number(mov.importe ?? 0);
    } else if (mov.tipo === "ingreso" && !mov.reserva_id) {
      // Solo contamos ingresos manuales si NO están asociados a una reserva
      ingresos += Number(mov.importe ?? 0);
    }
  });

  // Procesar ingresos de reservas
  reservations?.forEach(res => {
    ingresos += Number(res.importe_pagado ?? 0);
  });

  const numIngresos = (movements?.filter(m => m.tipo === 'ingreso' && !m.reserva_id).length || 0) + (reservations?.length || 0);

  return {
    ingresos,
    gastos,
    beneficio: ingresos - gastos,
    count,
    ticketMedio: numIngresos > 0 ? ingresos / numIngresos : 0
  };
}

export async function getFinanceMovements(month: number, year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // 1. Obtener movimientos reales
  const { data: movements, error: movError } = await supabase
    .from("finanza_movimiento")
    .select("*")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (movError) throw new Error(movError.message);

  // 2. Obtener reservas con pagos
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("id, nombre, importe_pagado, fecha_reserva, created_at, servicio:servicio_id(nombre)")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .gt("importe_pagado", 0)
    .is("deleted_at", null);

  if (resError) throw new Error(resError.message);

  // 3. Unificar (mapeando reservas a estructura de movimientos)
  const unifiedMovements: FinanceMovement[] = [
    ...((movements || []) as FinanceMovement[]).filter(m => !(m.tipo === 'ingreso' && m.reserva_id)), // Filtrar ingresos manuales vinculados a reserva
    ...(reservations || []).map(res => ({
      id: `reserva-${res.id}`,
      tipo: "ingreso" as const,
      categoria: (res.servicio as any)?.nombre || "Reserva",
      concepto: `Reserva - ${res.nombre}`,
      descripcion: null,
      importe: Number(res.importe_pagado ?? 0),
      fecha: res.fecha_reserva,
      metodo_pago: "Cobro Reserva",
      reserva_id: res.id,
      cliente_id: null,
      servicio_id: null,
      recurrente: false,
      notas: "Pago automático desde reserva",
      created_at: res.created_at
    }))
  ];

  // Ordenar por fecha desc
  return unifiedMovements.sort((a, b) => {
    const dateA = new Date(a.fecha).getTime();
    const dateB = new Date(b.fecha).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function createFinanceMovement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const tipo = formData.get("tipo") as string;
  const categoria = formData.get("categoria") as string;
  const concepto = formData.get("concepto") as string;
  const descripcion = formData.get("descripcion") as string || null;
  const importe = parseFloat(formData.get("importe") as string);
  const fecha = formData.get("fecha") as string;
  const metodo_pago = formData.get("metodo_pago") as string || null;
  const reserva_id = formData.get("reserva_id") as string || null;
  const cliente_id = formData.get("cliente_id") as string || null;
  const servicio_id = formData.get("servicio_id") as string || null;
  const notas = formData.get("notas") as string || null;

  if (importe <= 0) return { error: "El importe debe ser mayor a 0" };

  const { error } = await supabase.from("finanza_movimiento").insert({
    tipo,
    categoria,
    concepto,
    descripcion,
    importe,
    fecha,
    metodo_pago,
    reserva_id,
    cliente_id,
    servicio_id,
    notas
  });

  if (error) return { error: error.message };

  await createAuditLog({
    accion: "creación",
    entidad: "finanza",
    descripcion: `Movimiento ${tipo}: ${concepto} (${importe}€)`,
    metadata: { tipo, categoria, importe, reserva_id: reserva_id || undefined },
  });

  revalidatePath("/admin/finanzas");
  return { success: true };
}

export async function updateFinanceMovement(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const tipo = formData.get("tipo") as string;
  const categoria = formData.get("categoria") as string;
  const concepto = formData.get("concepto") as string;
  const descripcion = formData.get("descripcion") as string || null;
  const importe = parseFloat(formData.get("importe") as string);
  const fecha = formData.get("fecha") as string;
  const metodo_pago = formData.get("metodo_pago") as string || null;
  const reserva_id = formData.get("reserva_id") as string || null;
  const cliente_id = formData.get("cliente_id") as string || null;
  const servicio_id = formData.get("servicio_id") as string || null;
  const notas = formData.get("notas") as string || null;

  if (importe <= 0) return { error: "El importe debe ser mayor a 0" };

  const { error } = await supabase
    .from("finanza_movimiento")
    .update({
      tipo,
      categoria,
      concepto,
      descripcion,
      importe,
      fecha,
      metodo_pago,
      reserva_id,
      cliente_id,
      servicio_id,
      notas,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { error: error.message };

  await createAuditLog({
    accion: "edición",
    entidad: "finanza",
    entidad_id: id,
    descripcion: `Movimiento editado: ${concepto} (${importe}€)`,
    metadata: { tipo, categoria, importe },
  });

  revalidatePath("/admin/finanzas");
  return { success: true };
}

export async function deleteFinanceMovement(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { error } = await supabase
    .from("finanza_movimiento")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await createAuditLog({
    accion: "eliminación",
    entidad: "finanza",
    entidad_id: id,
    descripcion: `Movimiento ${id.slice(0, 8)}… eliminado (borrado lógico)`,
  });

  revalidatePath("/admin/finanzas");
  return { success: true };
}

export async function getFinanceStatsByYear(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Movimientos manuales
  const { data: movements, error: movError } = await supabase
    .from("finanza_movimiento")
    .select("tipo, importe, fecha, categoria, reserva_id")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (movError) throw new Error(movError.message);

  // Ingresos de reservas
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("importe_pagado, fecha_reserva, servicio:servicio_id(nombre)")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .gt("importe_pagado", 0)
    .is("deleted_at", null);

  if (resError) throw new Error(resError.message);

  const monthlyStats = Array.from({ length: 12 }, () => ({ ingresos: 0, gastos: 0, beneficio: 0 }));
  const categoryStats: Record<string, number> = {};

  movements?.forEach(mov => {
    const monthStr = mov.fecha?.split("-")[1];
    if (!monthStr) return;
    const month = parseInt(monthStr) - 1;
    const amount = Number(mov.importe ?? 0);
    
    if (!monthlyStats[month]) return;

    if (mov.tipo === "gasto") {
      monthlyStats[month].gastos += amount;
      monthlyStats[month].beneficio -= amount;
      categoryStats[mov.categoria] = (categoryStats[mov.categoria] || 0) + amount;
    } else if (mov.tipo === "ingreso" && !mov.reserva_id) {
      monthlyStats[month].ingresos += amount;
      monthlyStats[month].beneficio += amount;
      categoryStats[mov.categoria] = (categoryStats[mov.categoria] || 0) + amount;
    }
  });

  reservations?.forEach(res => {
    const monthStr = res.fecha_reserva.split("-")[1];
    if (!monthStr) return;
    const month = parseInt(monthStr) - 1;
    const amount = Number(res.importe_pagado ?? 0);
    const cat = (res.servicio as any)?.nombre || "Reserva";

    if (monthlyStats[month]) {
      monthlyStats[month].ingresos += amount;
      monthlyStats[month].beneficio += amount;
    }
    categoryStats[cat] = (categoryStats[cat] || 0) + amount;
  });

  return { monthlyStats, categoryStats };
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  // Buscamos reservas confirmadas o completadas con pago pendiente o parcial
  const { data: reservas, error } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .in("estado", ["confirmada", "completada"])
    .in("estado_pago", ["pendiente", "parcial"])
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: false });

  if (error) throw new Error(error.message);
  
  return reservas;
}

/**
 * Obtiene el resumen financiero de un año completo
 */
export async function getFinanceYearlySummary(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // 1. Movimientos manuales
  const { data: movements, error: movError } = await supabase
    .from("finanza_movimiento")
    .select("tipo, importe, fecha, reserva_id")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (movError) throw new Error(movError.message);

  // 2. Ingresos de reservas
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("importe_pagado, fecha_reserva")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .gt("importe_pagado", 0)
    .is("deleted_at", null);

  if (resError) throw new Error(resError.message);

  let ingresosTotal = 0;
  let gastosTotal = 0;
  let numIngresos = 0;
  
  const evolution = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    ingresos: 0,
    gastos: 0,
    beneficio: 0,
  }));

  movements?.forEach(mov => {
    const monthStr = mov.fecha?.split("-")[1];
    if (!monthStr) return;
    const month = parseInt(monthStr) - 1;
    const amount = Number(mov.importe ?? 0);

    if (evolution[month]) {
      if (mov.tipo === "ingreso" && !mov.reserva_id) {
        ingresosTotal += amount;
        evolution[month].ingresos += amount;
        numIngresos++;
      } else if (mov.tipo === "gasto") {
        gastosTotal += amount;
        evolution[month].gastos += amount;
      }
    }
  });

  reservations?.forEach(res => {
    const monthStr = res.fecha_reserva.split("-")[1];
    if (!monthStr) return;
    const month = parseInt(monthStr) - 1;
    const amount = Number(res.importe_pagado ?? 0);
    if (evolution[month]) {
      ingresosTotal += amount;
      evolution[month].ingresos += amount;
      numIngresos++;
    }
  });

  evolution.forEach(m => {
    m.beneficio = m.ingresos - m.gastos;
  });

  const bestMonth = evolution.reduce((prev, current) => 
    (current.ingresos > prev.ingresos) ? current : prev
  , evolution[0]);

  const worstMonth = evolution.reduce((prev, current) => 
    (current.ingresos < prev.ingresos && current.ingresos > 0) ? current : prev
  , evolution[0]);

  return {
    ingresosTotal,
    gastosTotal,
    beneficioTotal: ingresosTotal - gastosTotal,
    movimientosCount: (movements?.length || 0) + (reservations?.length || 0),
    ticketMedio: numIngresos > 0 ? ingresosTotal / numIngresos : 0,
    evolution,
    bestMonth,
    worstMonth
  };
}

/**
 * Obtiene insights avanzados de un año
 */
export async function getFinanceAnnualInsights(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Movimientos manuales
  const { data: movements, error: movError } = await supabase
    .from("finanza_movimiento")
    .select("*, servicio:servicio_id(nombre), cliente:cliente_id(nombre)")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (movError) throw new Error(movError.message);

  // Reservas
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("importe_pagado, fecha_reserva, servicio:servicio_id(nombre), cliente:cliente_id(nombre)")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .gt("importe_pagado", 0)
    .is("deleted_at", null);

  if (resError) throw new Error(resError.message);

  const serviceStats: Record<string, number> = {};
  const categorySpending: Record<string, number> = {};
  const clientValue: Record<string, number> = {};
  const paymentMethods: Record<string, number> = {};

  movements?.forEach(mov => {
    const amount = Number(mov.importe);
    
    if (mov.tipo === "gasto") {
      categorySpending[mov.categoria] = (categorySpending[mov.categoria] || 0) + amount;
    } else if (mov.tipo === "ingreso" && !mov.reserva_id) {
      if (mov.servicio) {
        serviceStats[mov.servicio.nombre] = (serviceStats[mov.servicio.nombre] || 0) + amount;
      }
      if (mov.cliente) {
        clientValue[mov.cliente.nombre] = (clientValue[mov.cliente.nombre] || 0) + amount;
      }
    }

    if (mov.metodo_pago) {
      paymentMethods[mov.metodo_pago] = (paymentMethods[mov.metodo_pago] || 0) + 1;
    }
  });

  reservations?.forEach(res => {
    const amount = Number(res.importe_pagado ?? 0);
    const sName = (res.servicio as any)?.nombre || "Reserva";
    const cName = (res.cliente as any)?.nombre || "Desconocido";

    serviceStats[sName] = (serviceStats[sName] || 0) + amount;
    clientValue[cName] = (clientValue[cName] || 0) + amount;
    
    // Para reservas el método de pago se registra como fijo por ahora
    const pMethod = "Cobro Reserva";
    paymentMethods[pMethod] = (paymentMethods[pMethod] || 0) + 1;
  });

  const getTop = (obj: Record<string, number>) => {
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  return {
    topService: getTop(serviceStats),
    topSpendingCategory: getTop(categorySpending),
    topClient: getTop(clientValue),
    mostUsedPaymentMethod: getTop(paymentMethods),
  };
}

/**
 * Obtiene los ingresos reales del mes actual
 */
export async function getMonthlyRevenue() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // 1. Ingresos manuales sin reserva_id
  const { data: manual, error: manError } = await supabase
    .from("finanza_movimiento")
    .select("importe")
    .eq("tipo", "ingreso")
    .is("reserva_id", null)
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (manError) return 0;

  // 2. Ingresos de reservas
  const { data: reservations, error: resError } = await supabase
    .from("reserva")
    .select("importe_pagado")
    .gte("fecha_reserva", startDate)
    .lte("fecha_reserva", endDate)
    .in("estado_pago", ["parcial", "pagado"])
    .not("estado", "in", "(cancelada,rechazada)")
    .is("deleted_at", null);

  if (resError) return 0;

  const totalManual = manual?.reduce((sum, m) => sum + Number(m.importe || 0), 0) || 0;
  const totalReservas = reservations?.reduce((sum, r) => sum + Number(r.importe_pagado || 0), 0) || 0;

  return totalManual + totalReservas;
}
