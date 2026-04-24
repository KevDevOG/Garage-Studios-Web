import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies | Garage Studios",
  description: "Información sobre el uso de cookies en Garage Studios.",
};

export default function CookiesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="text-3xl font-bold sm:text-4xl mb-8">Política de Cookies</h1>
      <div className="space-y-8 text-muted">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Uso actual de cookies</h2>
          <div className="bg-card-bg border border-card-border p-6 rounded-xl">
            <p className="font-medium text-white">
              Actualmente, el sitio web de Garage Studios <strong>NO utiliza cookies propias ni de terceros</strong> para rastrear, analizar ni almacenar información de los usuarios en su navegador.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. ¿Qué son las cookies?</h2>
          <p>
            Una cookie es un pequeño archivo de texto que un sitio web guarda en tu ordenador o dispositivo móvil cuando visitas el sitio. Las cookies se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Actualizaciones futuras</h2>
          <p>
            Si en el futuro Garage Studios implementara herramientas de análisis web, pasarelas de pago o cualquier tecnología que requiera el uso de cookies para su funcionamiento, esta Política será actualizada de inmediato. 
          </p>
          <p className="mt-2">
            En dicho caso, se habilitará un banner de consentimiento explícito para que el Usuario pueda aceptar o rechazar el uso de cookies no esenciales, de conformidad con el Reglamento General de Protección de Datos (RGPD).
          </p>
        </section>
      </div>
    </section>
  );
}
