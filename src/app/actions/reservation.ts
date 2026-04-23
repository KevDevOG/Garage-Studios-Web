"use server";

import { createClient } from "@/lib/supabase/server";

export interface ReservationData {
  name: string;
  phone: string;
  email: string;
  service: string; // Espera un UUID
  date: string;
  notes: string;
}

export async function submitReservationAction(data: ReservationData) {
  const supabase = await createClient();

  // Mapeamos los campos del formulario a los de la tabla 'reserva'
  const { error } = await supabase.from("reserva").insert([
    {
      servicio_id: data.service,
      nombre: data.name,
      telefono: data.phone,
      email: data.email,
      fecha_reserva: data.date,
      observaciones: data.notes || null,
      estado: "pendiente",
    },
  ]);

  if (error) {
    console.error("Error al insertar reserva en Supabase:", error);
    throw new Error("No se pudo enviar la solicitud. Inténtalo más tarde.");
  }
}
