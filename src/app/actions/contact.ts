"use server";

import { createClient } from "@/lib/supabase/server";

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  acceptPrivacy: boolean;
}

export async function submitContactAction(data: ContactData) {
  if (!data.acceptPrivacy) {
    throw new Error("Debes aceptar la política de privacidad para enviar el mensaje.");
  }

  const supabase = await createClient();

  // Insertar datos en la tabla contacto
  const { error } = await supabase.from("contacto").insert([
    {
      nombre: data.name,
      email: data.email,
      telefono: data.phone,
      asunto: data.subject,
      mensaje: data.message,
      accepted_privacy_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error al insertar contacto en Supabase:", error);
    throw new Error("No se pudo enviar el mensaje. Inténtalo más tarde.");
  }
}
