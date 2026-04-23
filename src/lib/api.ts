// ── API simulada ─────────────────────────────────────────
// Estas funciones simulan peticiones al backend.
// Cuando el backend esté listo, solo hay que reemplazar
// el cuerpo de cada función por un fetch real.

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ReservationFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  notes: string;
}

/**
 * Envía el formulario de contacto.
 *
 * TODO: Reemplazar por fetch real cuando el backend esté listo.
 * Endpoint futuro: POST /api/contacto
 */
export async function submitContactForm(data: ContactFormData): Promise<void> {
  // Simula una petición de red (1 segundo de espera)
  return new Promise((resolve) => {
    console.log("[API Mock] Enviando formulario de contacto:", data);
    setTimeout(resolve, 1000);
  });

  // ── Implementación real (futuro) ──
  // const response = await fetch("/api/contacto", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!response.ok) throw new Error("Error al enviar el mensaje");
}

/**
 * Envía la solicitud de reserva.
 *
 * TODO: Reemplazar por fetch real cuando el backend esté listo.
 * Endpoint futuro: POST /api/reservas
 */
export async function submitReservationForm(
  data: ReservationFormData
): Promise<void> {
  // Simula una petición de red (1 segundo de espera)
  return new Promise((resolve) => {
    console.log("[API Mock] Enviando solicitud de reserva:", data);
    setTimeout(resolve, 1000);
  });

  // ── Implementación real (futuro) ──
  // const response = await fetch("/api/reservas", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });
  // if (!response.ok) throw new Error("Error al enviar la solicitud");
}
