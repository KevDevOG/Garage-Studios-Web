"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "¿Cómo puedo reservar una sesión?",
    answer: "Es muy sencillo. Puedes usar el formulario de reserva en esta web, escribirnos por WhatsApp o enviarnos un mensaje directo por Instagram. Una vez recibamos tu solicitud, revisaremos la disponibilidad del estudio y te confirmaremos la fecha y hora lo antes posible."
  },
  {
    question: "¿Tengo que pagar antes de ir al estudio?",
    answer: "Generalmente solicitamos una pequeña señal para bloquear la fecha en el calendario. El resto del pago se realiza el día de la sesión. Aceptamos pagos en efectivo, Bizum o transferencia bancaria."
  },
  {
    question: "¿Cuánto dura una sesión de grabación?",
    answer: "Depende del servicio contratado. Las sesiones individuales suelen tener una duración mínima recomendada de 1 o 2 horas para asegurar que sacamos el máximo partido a tu voz o instrumento. En el catálogo de servicios puedes ver las duraciones estimadas de cada pack."
  },
  {
    question: "¿Puedo llevar mi propia instrumental?",
    answer: "¡Por supuesto! Puedes traerla en un pendrive o enviárnosla previamente por email o WeTransfer. Recomendamos que sea en formato .WAV de alta calidad para obtener el mejor resultado final."
  },
  {
    question: "¿Hacéis mezcla y masterización?",
    answer: "Sí, es una de nuestras especialidades. Trabajamos tanto con grabaciones realizadas en nuestro estudio como con pistas externas que nos envíes para mezclar. Buscamos siempre un sonido competitivo y profesional adaptado a los estándares actuales."
  },
  {
    question: "¿También hacéis videoclips y sesiones de fotos?",
    answer: "Así es. A través de nuestra división 'Garage Visuals' ofrecemos servicios integrales de imagen: desde videoclips en 4K hasta contenido estratégico para tus redes sociales y sesiones fotográficas de artista."
  },
  {
    question: "¿Dónde está ubicado el estudio?",
    answer: "Estamos situados en Las Palmas de Gran Canaria, concretamente en C. Drago (35010). Es una ubicación de fácil acceso para que puedas venir cómodamente a trabajar en tu música."
  },
  {
    question: "¿Puedo pedir presupuesto para un proyecto completo?",
    answer: "Claro que sí. Si tienes en mente un EP, un álbum completo o un proyecto audiovisual a medida, contáctanos directamente. Estudiaremos tu caso y te ofreceremos un presupuesto personalizado con un descuento por volumen de trabajo."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-card-border bg-gradient-to-b from-transparent to-card-bg/20">
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
        <div className="mb-16 text-center animate-fade-in">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            Preguntas <span className="text-accent">frecuentes</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 bg-accent"></div>
          <p className="mt-6 text-lg font-medium text-muted">
            Resolvemos tus dudas antes de empezar a trabajar juntos.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div 
              key={index}
              className="overflow-hidden rounded-xl border border-card-border bg-card-bg transition-all hover:border-accent/30"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="text-sm font-black uppercase italic tracking-widest text-white sm:text-base">
                  {faq.question}
                </span>
                <span className={`ml-4 text-accent transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="border-t border-card-border p-6 pt-0 text-sm font-medium leading-relaxed text-gray-400">
                  <div className="pt-6">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted">
            ¿No encuentras lo que buscas? <a href="#contacto" className="font-bold text-accent hover:underline">Escríbenos directamente</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
