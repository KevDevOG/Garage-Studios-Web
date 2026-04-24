import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal | Garage Studios",
  description: "Aviso legal e información sobre el titular de Garage Studios.",
};

export default function AvisoLegalPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="text-3xl font-bold sm:text-4xl mb-8">Aviso Legal</h1>
      <div className="space-y-8 text-muted">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">1. Identificación del Titular</h2>
          <p>
            En cumplimiento de la Ley de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI), se informa que la presente página web es titularidad de <strong>Garage Studios</strong>, con ubicación en Avenida Parque Central 1, Las Palmas de Gran Canaria, España.
          </p>
          <p className="mt-2">
            <strong>Email de contacto:</strong> garagestudioslp@gmail.com <br/>
            <strong>Actividad principal:</strong> Estudio de grabación y producción audiovisual.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">2. Uso del Sitio Web</h2>
          <p>
            El acceso y uso de esta página web atribuye la condición de Usuario, el cual acepta, desde dicho acceso, los términos de uso reflejados en el presente Aviso Legal. El Usuario se compromete a hacer un uso adecuado de los contenidos y servicios que Garage Studios ofrece a través de su portal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">3. Propiedad Intelectual</h2>
          <p>
            Todos los contenidos del sitio web (textos, fotografías, gráficos, imágenes, diseño y código fuente) son propiedad intelectual de Garage Studios o de terceros, sin que puedan entenderse cedidos al Usuario ninguno de los derechos de explotación sobre los mismos. Queda expresamente prohibida la reproducción, distribución y comunicación pública de todo o parte de los contenidos de esta web con fines comerciales sin la autorización expresa de Garage Studios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">4. Responsabilidad</h2>
          <p>
            Garage Studios no se hace responsable de los posibles errores de seguridad o daños que puedan causarse en el sistema informático del Usuario (hardware y software), ni de los ficheros o documentos almacenados en el mismo, como consecuencia de la presencia de virus en el ordenador del Usuario utilizado para la conexión a los servicios de la web, o por el mal funcionamiento del navegador.
          </p>
        </section>
      </div>
    </section>
  );
}
