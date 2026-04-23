"use client";

import { useState, type FormEvent } from "react";
import { submitContactAction } from "@/app/actions/contact";
import {
  validateRequired,
  validateEmail,
  validatePhone,
} from "@/lib/validation";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export default function ContactForm() {
  // ── Estado ──
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Validación ──
  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    const nameErr = validateRequired(formData.name, "El nombre");
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validatePhone(formData.phone, false);
    if (phoneErr) newErrors.phone = phoneErr;

    const subjectErr = validateRequired(formData.subject, "El asunto");
    if (subjectErr) newErrors.subject = subjectErr;

    const messageErr = validateRequired(formData.message, "El mensaje");
    if (messageErr) newErrors.message = messageErr;

    return newErrors;
  }

  // ── Actualizar campo ──
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // ── Enviar ──
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await submitContactAction(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setErrors({ message: "Error al enviar. Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  // ── Mensaje de éxito ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg p-8 text-center">
        <div className="animate-bounce text-6xl">✅</div>
        <h3 className="mt-6 text-xl font-bold">¡Mensaje enviado!</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Te responderemos lo antes posible o puedes escribirnos directamente por WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://wa.me/34693489379"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#128C7E] hover:-translate-y-0.5"
          >
            <span className="text-lg">💬</span> WhatsApp Directo
          </a>
          <button
            onClick={() => setSubmitted(false)}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario ──
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      {/* Nombre */}
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
          Nombre <span className="text-accent">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tu nombre completo"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {errors.name && (
          <p id="contact-name-error" className="mt-1 text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
          Email <span className="text-accent">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
        />
        {errors.email && (
          <p id="contact-email-error" className="mt-1 text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium">
          Teléfono
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+34 600 000 000"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
        />
        {errors.phone && (
          <p id="contact-phone-error" className="mt-1 text-xs text-red-400">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Asunto */}
      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium">
          Asunto <span className="text-accent">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          value={formData.subject}
          onChange={handleChange}
          placeholder="¿En qué podemos ayudarte?"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-xs text-red-400">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Mensaje */}
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
          Mensaje <span className="text-accent">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          placeholder="Cuéntanos los detalles..."
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? "Enviando..." : "Enviar mensaje"}
        </button>
        <a
          href="https://wa.me/34693489379"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#128C7E] hover:-translate-y-0.5"
        >
          <span className="text-lg">💬</span> Escribir por WhatsApp
        </a>
      </div>
    </form>
  );
}
