"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { submitReservationAction } from "@/app/actions/reservation";
import type { DBService } from "@/app/actions/services";
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateSelect,
  validateDate,
} from "@/lib/validation";

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  date?: string;
  notes?: string;
}

interface ReservationFormProps {
  servicesList: DBService[];
}

export default function ReservationForm({ servicesList }: ReservationFormProps) {
  const searchParams = useSearchParams();

  // ── Estado ──
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    date: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-seleccionar servicio si viene por URL
  useEffect(() => {
    const servicio = searchParams.get("servicio");
    if (servicio) {
      setFormData((prev) => ({ ...prev, service: servicio }));
    }
  }, [searchParams]);

  // ── Validación ──
  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    const nameErr = validateRequired(formData.name, "El nombre");
    if (nameErr) newErrors.name = nameErr;

    const phoneErr = validatePhone(formData.phone, true);
    if (phoneErr) newErrors.phone = phoneErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const serviceErr = validateSelect(formData.service, "servicio");
    if (serviceErr) newErrors.service = serviceErr;

    const dateErr = validateDate(formData.date);
    if (dateErr) newErrors.date = dateErr;

    return newErrors;
  }

  // ── Actualizar campo ──
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      await submitReservationAction(formData);
      setSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "",
        date: "",
        notes: "",
      });
    } catch {
      setErrors({ notes: "Error al enviar. Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  // ── Mensaje de éxito ──
  if (submitted) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-8 text-center">
        <span className="text-4xl">📩</span>
        <h3 className="mt-4 text-lg font-semibold">
          ¡Solicitud de reserva enviada!
        </h3>
        <p className="mt-2 text-sm text-muted">
          Hemos recibido tu solicitud. Nos pondremos en contacto contigo para
          confirmar disponibilidad y cerrar los detalles.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm font-medium text-accent hover:underline"
        >
          Enviar otra solicitud
        </button>
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
        <label htmlFor="res-name" className="mb-1 block text-sm font-medium">
          Nombre <span className="text-accent">*</span>
        </label>
        <input
          id="res-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tu nombre completo"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "res-name-error" : undefined}
        />
        {errors.name && (
          <p id="res-name-error" className="mt-1 text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="res-phone" className="mb-1 block text-sm font-medium">
          Teléfono <span className="text-accent">*</span>
        </label>
        <input
          id="res-phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+34 600 000 000"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "res-phone-error" : undefined}
        />
        {errors.phone && (
          <p id="res-phone-error" className="mt-1 text-xs text-red-400">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="res-email" className="mb-1 block text-sm font-medium">
          Email <span className="text-accent">*</span>
        </label>
        <input
          id="res-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "res-email-error" : undefined}
        />
        {errors.email && (
          <p id="res-email-error" className="mt-1 text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Servicio */}
      <div>
        <label htmlFor="res-service" className="mb-1 block text-sm font-medium">
          Servicio <span className="text-accent">*</span>
        </label>
        <select
          id="res-service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          aria-invalid={!!errors.service}
          aria-describedby={errors.service ? "res-service-error" : undefined}
        >
          <option value="">Selecciona un servicio</option>
          {servicesList.length === 0 ? (
            <option value="" disabled>
              No hay servicios disponibles
            </option>
          ) : (
            servicesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} — {s.precio} €
              </option>
            ))
          )}
        </select>
        {errors.service && (
          <p id="res-service-error" className="mt-1 text-xs text-red-400">
            {errors.service}
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="res-date" className="mb-1 block text-sm font-medium">
          Fecha deseada <span className="text-accent">*</span>
        </label>
        <input
          id="res-date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "res-date-error" : undefined}
        />
        {errors.date && (
          <p id="res-date-error" className="mt-1 text-xs text-red-400">
            {errors.date}
          </p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label htmlFor="res-notes" className="mb-1 block text-sm font-medium">
          Observaciones
        </label>
        <textarea
          id="res-notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Información adicional sobre tu proyecto, horario preferido, etc."
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-red-400">{errors.notes}</p>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-muted">
        * Esta es una solicitud de reserva. Te contactaremos para confirmar
        disponibilidad y detalles.
      </p>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Enviando solicitud..." : "Enviar solicitud de reserva"}
      </button>
    </form>
  );
}
