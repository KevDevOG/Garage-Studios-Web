import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Garage Studios",
  description: "Información sobre cómo Garage Studios trata tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="text-3xl font-bold sm:text-4xl mb-8">Política de Privacidad</h1>
      <div className="space-y-8 text-muted">
        <p>
          Esta Política de Privacidad describe cómo <strong>Garage Studios</strong> (ubicado en Las Palmas de Gran Canaria) recoge, utiliza y protege los datos personales de los usuarios de nuestro sitio web, en cumplimiento con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Qué datos se recogen</h2>
          <p>
            A través de los formularios de nuestra web (por ejemplo, el formulario de contacto o el de reservas), podemos recopilar datos como:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Nombre y apellidos</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Información relevante sobre tu proyecto musical (descripciones, enlaces).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. Finalidad del tratamiento</h2>
          <p>
            Los datos proporcionados se utilizarán única y exclusivamente para:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Gestionar las reservas de sesiones en nuestro estudio.</li>
            <li>Responder a consultas o peticiones enviadas mediante el formulario de contacto.</li>
            <li>Coordinar proyectos de grabación y producción audiovisual.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Base legal</h2>
          <p>
            La base legal para el tratamiento de tus datos es tu <strong>consentimiento explícito</strong>, que otorgas al marcar la casilla de aceptación y enviar cualquiera de nuestros formularios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Conservación de datos</h2>
          <p>
            Los datos personales proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales, y siempre que el Usuario no solicite su supresión.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">5. Derechos del Usuario</h2>
          <p>
            Como usuario, tienes derecho a acceder, rectificar o solicitar la supresión de tus datos. Para ejercer estos derechos, puedes enviar un correo electrónico a: <strong className="text-white">garagestudioslp@gmail.com</strong> adjuntando una copia de tu documento de identidad e indicando el derecho que deseas ejercer.
          </p>
        </section>
      </div>
    </section>
  );
}
