import type { Metadata } from "next";
import { Suspense } from "react";
import ReservationForm from "@/components/ReservationForm";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Reservas — Garage Studios",
  description:
    "Solicita tu reserva en Garage Studios. Elige servicio, fecha y te confirmaremos disponibilidad.",
};

export default async function ReservasPage() {
  const servicesList = await getActiveServices();

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Solicitar Reserva</h1>
        <p className="mt-3 text-muted">
          Rellena el formulario y nos pondremos en contacto contigo para
          confirmar disponibilidad y detalles de tu sesión.
        </p>
      </div>

      {/* Formulario con Suspense para useSearchParams */}
      <Suspense fallback={<div className="text-center text-muted">Cargando formulario...</div>}>
        <ReservationForm servicesList={servicesList} />
      </Suspense>

      {/* Info adicional */}
      <div className="mt-8 rounded-xl border border-card-border bg-card-bg p-6">
        <h3 className="text-sm font-semibold">¿Cómo funciona?</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
          <li>Rellena el formulario con tus datos y el servicio que necesitas.</li>
          <li>Nuestro equipo revisará tu solicitud y comprobará disponibilidad.</li>
          <li>Te contactaremos para confirmar la reserva y acordar los detalles.</li>
          <li>¡Ven al estudio y disfruta de la sesión!</li>
        </ol>
      </div>
    </section>
  );
}
