"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { submitReservationAction } from "@/app/actions/reservation";
import { getAvailableSlots } from "@/app/actions/availability";
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
  timeSlot?: string;
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
    timeSlot: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Disponibilidad horaria ──
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | undefined>();
  const [serviceDuration, setServiceDuration] = useState<number>(0);

  // Pre-seleccionar servicio si viene por URL
  useEffect(() => {
    const servicio = searchParams.get("servicio");
    if (servicio) {
      setFormData((prev) => ({ ...prev, service: servicio }));
    }
  }, [searchParams]);

  // Cargar slots disponibles cuando cambian servicio + fecha
  useEffect(() => {
    if (formData.service && formData.date) {
      setLoadingSlots(true);
      setAvailableSlots([]);
      setSlotsMessage(undefined);
      setFormData((prev) => ({ ...prev, timeSlot: "" }));

      getAvailableSlots(formData.service, formData.date)
        .then((result) => {
          setAvailableSlots(result.slots);
          setServiceDuration(result.duracion);
          setSlotsMessage(result.mensaje);
        })
        .catch(() => {
          setSlotsMessage("Error al cargar horarios. Inténtalo de nuevo.");
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    } else {
      setAvailableSlots([]);
      setSlotsMessage(undefined);
    }
  }, [formData.service, formData.date]);

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

    if (!formData.timeSlot) {
      newErrors.timeSlot = "Selecciona un horario";
    }

    return newErrors;
  }

  // ── Actualizar campo ──
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        timeSlot: "",
        notes: "",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al enviar. Inténtalo de nuevo.";
      setErrors({ notes: message });
    } finally {
      setLoading(false);
    }
  }

  // ── Fecha mínima: hoy ──
  const today = new Date().toISOString().split("T")[0];

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
          min={today}
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

      {/* Hora — Solo visible cuando hay servicio + fecha */}
      {formData.service && formData.date && (
        <div>
          <label htmlFor="res-timeSlot" className="mb-1 block text-sm font-medium">
            Hora <span className="text-accent">*</span>
          </label>
          {loadingSlots ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"></span>
              Cargando horarios disponibles...
            </div>
          ) : availableSlots.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, timeSlot: slot }));
                      setErrors((prev) => ({ ...prev, timeSlot: undefined }));
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                      formData.timeSlot === slot
                        ? "border-accent bg-accent text-black"
                        : "border-card-border bg-card-bg text-foreground hover:border-accent/50 hover:bg-accent/10"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {serviceDuration > 0 && formData.timeSlot && (
                <p className="mt-2 text-xs text-muted">
                  Sesión de {serviceDuration} min — Termina a las{" "}
                  {(() => {
                    const [h, m] = formData.timeSlot.split(":").map(Number);
                    const endMin = h * 60 + m + serviceDuration;
                    const endH = Math.floor(endMin / 60) % 24;
                    const endM = endMin % 60;
                    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                  })()}
                </p>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {slotsMessage || "No hay horarios disponibles para este día."}
            </p>
          )}
          {errors.timeSlot && (
            <p className="mt-1 text-xs text-red-400">{errors.timeSlot}</p>
          )}
        </div>
      )}

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
        className="w-full rounded-full bg-accent px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? "Enviando solicitud..." : "Enviar solicitud de reserva"}
      </button>
    </form>
  );
}
