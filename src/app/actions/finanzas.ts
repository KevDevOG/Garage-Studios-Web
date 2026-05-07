"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("tipo, importe")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  let ingresos = 0;
  let gastos = 0;
  let count = data ? data.length : 0;

  data?.forEach(mov => {
    if (mov.tipo === "ingreso") ingresos += Number(mov.importe);
    else if (mov.tipo === "gasto") gastos += Number(mov.importe);
  });

  return {
    ingresos,
    gastos,
    beneficio: ingresos - gastos,
    count,
    ticketMedio: ingresos > 0 && data ? ingresos / data.filter(m => m.tipo === 'ingreso').length : 0
  };
}

export async function getFinanceMovements(month: number, year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("*")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as FinanceMovement[];
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

  revalidatePath("/admin/finanzas");
  return { success: true };
}

export async function getFinanceStatsByYear(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("tipo, importe, fecha, categoria")
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const monthlyStats = Array.from({ length: 12 }, () => ({ ingresos: 0, gastos: 0, beneficio: 0 }));
  const categoryStats: Record<string, number> = {};

  data?.forEach(mov => {
    // mov.fecha es YYYY-MM-DD, parsear manualmente para evitar desfases de zona horaria
    const parts = mov.fecha.split("-");
    const month = parseInt(parts[1]) - 1; // Meses 0-11
    const amount = Number(mov.importe);
    
    if (mov.tipo === "ingreso") {
      monthlyStats[month].ingresos += amount;
      monthlyStats[month].beneficio += amount;
    } else {
      monthlyStats[month].gastos += amount;
      monthlyStats[month].beneficio -= amount;
    }

    if (!categoryStats[mov.categoria]) categoryStats[mov.categoria] = 0;
    categoryStats[mov.categoria] += amount;
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
