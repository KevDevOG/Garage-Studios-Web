"use server";

import { createClient } from "@/lib/supabase/server";
import { validateSlotAvailable } from "@/app/actions/availability";
import { minutesToTime, timeToMinutes } from "@/lib/schedule";
import { findOrCreateClientePublic, updateClienteStats } from "@/app/actions/clientes";

export interface ReservationData {
  name: string;
  phone: string;
  email: string;
  service: string; // UUID
  date: string;
  timeSlot: string; // HH:mm
  notes: string;
}

export async function submitReservationAction(data: ReservationData) {
  const supabase = await createClient();

  // 1. Obtener duración y precio base del servicio
  const { data: servicio, error: srvErr } = await supabase
    .from("servicio")
    .select("duracion_minutos, precio")
    .eq("id", data.service)
    .single();

  if (srvErr || !servicio) {
    throw new Error("Servicio no encontrado.");
  }

  const duracion = servicio.duracion_minutos;
  const precioBase = servicio.precio;
  const horaInicio = data.timeSlot;
  const horaFin = minutesToTime(timeToMinutes(horaInicio) + duracion);

  // 2. Validar disponibilidad en servidor (prevenir race conditions)
  const isAvailable = await validateSlotAvailable(
    data.date,
    horaInicio,
    duracion
  );

  if (!isAvailable) {
    throw new Error(
      "El horario seleccionado ya no está disponible. Por favor, elige otro."
    );
  }

  // 3. Crear o encontrar cliente
  const clienteId = await findOrCreateClientePublic(supabase, {
    nombre: data.name,
    email: data.email,
    telefono: data.phone,
    origen: "web",
  });

  // 4. Insertar reserva con cliente_id
  const { error } = await supabase.from("reserva").insert([
    {
      servicio_id: data.service,
      nombre: data.name,
      telefono: data.phone,
      email: data.email,
      fecha_reserva: data.date,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_minutos: duracion,
      observaciones: data.notes || null,
      estado: "pendiente",
      precio: precioBase,
      origen: "web",
      cliente_id: clienteId,
    },
  ]);

  if (error) {
    console.error("Error al insertar reserva en Supabase:", error);
    throw new Error("No se pudo enviar la solicitud. Inténtalo más tarde.");
  }

  // 5. Actualizar estadísticas del cliente
  await updateClienteStats(supabase, clienteId);
}

