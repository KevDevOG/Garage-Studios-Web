import type { Metadata } from "next";
import { Suspense } from "react";
import ReservationForm from "@/components/ReservationForm";
import { getActiveServices } from "@/app/actions/services";

export const metadata: Metadata = {
  title: "Reservas y Sesiones en el Estudio de Grabación | Garage Studios",
  description:
    "Reserva tu sesión de grabación, producción musical, o mezcla y masterización en Las Palmas online. Elige tu fecha y hora en Garage Studios.",
  openGraph: {
    title: "Reservas y Sesiones en el Estudio de Grabación | Garage Studios",
    description:
      "Reserva tu sesión de grabación, producción musical, o mezcla y masterización en Las Palmas online. Elige tu fecha y hora en Garage Studios.",
    url: "https://garagestudios.es/reservas",
    siteName: "Garage Studios",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-garage-studios.png",
        width: 1200,
        height: 630,
        alt: "Reservas y Sesiones en Garage Studios - Estudio de Grabación en Las Palmas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reservas y Sesiones en el Estudio de Grabación | Garage Studios",
    description:
      "Reserva tu sesión de grabación, producción musical, o mezcla y masterización en Las Palmas online. Elige tu fecha y hora en Garage Studios.",
    images: ["/og-garage-studios.png"],
  },
};


export default async function ReservasPage() {
  const servicesList = await getActiveServices();

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {/* Encabezado */}
      <div className="mb-20 text-center animate-fade-in">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter sm:text-6xl">Tu Próxima <span className="text-accent">Sesión</span></h1>
        <div className="mx-auto mt-6 h-1.5 w-24 bg-accent"></div>
        <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-muted">
          Reserva tu sesión en nuestro estudio musical de Las Palmas. Elige tu servicio y nos pondremos en contacto contigo para coordinar y planificar tu grabación.
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
