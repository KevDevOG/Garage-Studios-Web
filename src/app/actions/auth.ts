"use server";

import { createClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-allowlist";
import { redirect } from "next/navigation";

const LOGIN_ERROR = "Credenciales incorrectas o usuario no encontrado";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "El email y la contraseña son obligatorios" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: LOGIN_ERROR };
  }

  // Una cuenta válida de Supabase Auth que no está en la lista privada de
  // administradores no entra al panel: se cierra su sesión y se responde con
  // el mismo mensaje genérico (no revela qué cuentas existen).
  if (!(await isAuthorizedAdmin(supabase, data.user))) {
    // scope local: si la comprobación falla por un error transitorio, no se
    // cierran las sesiones del administrador en otros dispositivos.
    await supabase.auth.signOut({ scope: "local" });
    return { error: LOGIN_ERROR };
  }

  // Redirigir al dashboard tras un login exitoso
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Redirigir al login
  redirect("/admin/login");
}
