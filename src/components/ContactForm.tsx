"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { submitContactAction } from "@/app/actions/contact";
import { validateRequired, validateEmail, validatePhone } from "@/lib/validation";
import { useTurnstile } from "@/components/ui/Turnstile";
import FormAlert from "@/components/ui/FormAlert";
import { CheckCircle, MessageCircle } from "lucide-react";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  acceptPrivacy?: string;
}

const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactForm() {
  // ── Estado ──
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const turnstile = useTurnstile("dark");
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

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

    if (!acceptPrivacy) newErrors.acceptPrivacy = "Debes aceptar la política de privacidad";

    return newErrors;
  }

  // ── Actualizar campo ──
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (formError) setFormError(null);
  }

  // ── Enviar ──
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const newErrors = validate();
    setErrors(newErrors);
    setFormError(null);
    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      document.getElementById(`contact-${firstField}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await submitContactAction({
        ...formData,
        acceptPrivacy,
        turnstileToken: turnstile.token ?? undefined,
      });

      if (!result.ok) {
        setFormError(result.error);
        turnstile.reset();
        return;
      }

      setSubmitted(true);
      setFormData(EMPTY_FORM);
      setAcceptPrivacy(false);
    } catch {
      setFormError("No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.");
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  }

  // ── Mensaje de éxito ──
  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center rounded-xl border border-accent/30 bg-card-bg p-8 text-center outline-none animate-fade-in"
      >
        <CheckCircle className="mb-4 h-14 w-14 text-accent" aria-hidden="true" />
        <h2 className="text-xl font-black uppercase italic tracking-tight">¡Mensaje enviado!</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Te responderemos lo antes posible. Si tienes prisa, escríbenos directamente por WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://wa.me/34661652638"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:-translate-y-0.5 hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp Directo
          </a>
          <button
            type="button"
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
      aria-busy={loading}
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      {/* Nombre */}
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
          Nombre <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
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
          Email <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
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
          Teléfono <span className="text-xs font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
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
          Asunto <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={150}
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
          Mensaje <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          maxLength={5000}
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

      {/* Política de Privacidad */}
      <div className="pt-2">
        <label className="group flex cursor-pointer items-start gap-3">
          <div className="relative mt-0.5 flex items-center">
            <input
              id="contact-acceptPrivacy"
              type="checkbox"
              checked={acceptPrivacy}
              aria-invalid={!!errors.acceptPrivacy}
              aria-describedby={errors.acceptPrivacy ? "contact-privacy-error" : undefined}
              onChange={(e) => {
                setAcceptPrivacy(e.target.checked);
                if (errors.acceptPrivacy) setErrors((prev) => ({ ...prev, acceptPrivacy: undefined }));
              }}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-card-border bg-card-bg transition-all checked:border-accent checked:bg-accent hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/40 focus:outline-none"
            />
            <svg
              className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 text-black opacity-0 transition-all duration-300 peer-checked:scale-110 peer-checked:opacity-100"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-xs leading-relaxed text-muted transition-colors group-hover:text-foreground/90">
            He leído y acepto la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidad
            </a>
          </span>
        </label>
        {errors.acceptPrivacy && (
          <p id="contact-privacy-error" className="mt-2 text-xs font-bold text-red-400">
            {errors.acceptPrivacy}
          </p>
        )}
      </div>

      {turnstile.widget}

      <FormAlert message={formError} />

      {/* Botones */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? "Enviando..." : "Enviar mensaje"}
        </button>
        <a
          href="https://wa.me/34661652638"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:-translate-y-0.5 hover:bg-[#128C7E]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Escribir por WhatsApp
        </a>
      </div>
    </form>
  );
}
