"use client";

import { useState, useRef, useCallback, useEffect, type FormEvent } from "react";
import Script from "next/script";
import { submitContactAction } from "@/app/actions/contact";
import {
  validateRequired,
  validateEmail,
  validatePhone,
} from "@/lib/validation";
import { CheckCircle, MessageCircle } from "lucide-react";

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
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<FormErrors & { acceptPrivacy?: string; turnstile?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Render Turnstile widget when script loads
  const renderTurnstile = useCallback(() => {
    if (turnstileSiteKey && turnstileRef.current && (window as any).turnstile) {
      turnstileRef.current.innerHTML = "";
      (window as any).turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        theme: "dark",
      });
    }
  }, [turnstileSiteKey]);

  useEffect(() => {
    if ((window as any).turnstile && turnstileSiteKey) {
      renderTurnstile();
    }
  }, [renderTurnstile, turnstileSiteKey]);

  // ── Validación ──
  function validate(): FormErrors & { acceptPrivacy?: string } {
    const newErrors: FormErrors & { acceptPrivacy?: string } = {};

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

    if (!acceptPrivacy) {
      newErrors.acceptPrivacy = "Debes aceptar la política de privacidad";
    }

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
      await submitContactAction({ ...formData, acceptPrivacy, turnstileToken: turnstileToken || undefined });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setAcceptPrivacy(false);
      setTurnstileToken(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar. Inténtalo de nuevo.";
      setErrors({ message });
      // Reset Turnstile widget para que se pueda volver a completar
      if ((window as any).turnstile && turnstileSiteKey) {
        renderTurnstile();
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Mensaje de éxito ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-accent mb-6 animate-bounce" />
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
            <MessageCircle className="w-5 h-5" /> WhatsApp Directo
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

      {/* Política de Privacidad */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => {
                setAcceptPrivacy(e.target.checked);
                if (errors.acceptPrivacy) {
                  setErrors((prev) => ({ ...prev, acceptPrivacy: undefined }));
                }
              }}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-card-border bg-card-bg transition-all checked:border-accent checked:bg-accent hover:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none peer-checked:shadow-[0_0_10px_rgba(245,158,11,0.4)]"
            />
            <svg
              className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white transition-all duration-300 scale-0 opacity-0 peer-checked:scale-110 peer-checked:opacity-100"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-xs leading-relaxed text-muted group-hover:text-foreground/90 transition-colors">
            He leído y acepto la{" "}
            <a
              href="/privacidad"
              target="_blank"
              className="text-accent font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidad
            </a>
          </span>
        </label>
        {errors.acceptPrivacy && (
          <p className="mt-2 text-[10px] font-bold uppercase tracking-tight text-red-400">
            {errors.acceptPrivacy}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile Anti-Bot */}
      {turnstileSiteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onLoad={renderTurnstile}
          />
          <div ref={turnstileRef} className="flex justify-center" />
          {errors.turnstile && (
            <p className="text-xs text-red-400 text-center">{errors.turnstile}</p>
          )}
        </>
      )}

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
          <MessageCircle className="w-5 h-5" /> Escribir por WhatsApp
        </a>
      </div>
    </form>
  );
}
