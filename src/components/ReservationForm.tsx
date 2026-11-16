"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
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
import { todayInStudio } from "@/lib/dates";
import { minutesToTime, timeToMinutes, formatTime, STUDIO_HOURS } from "@/lib/schedule";
import { useTurnstile, TurnstileWidget } from "@/components/ui/Turnstile";
import FormAlert from "@/components/ui/FormAlert";
import { Send, CalendarCheck, Clock } from "lucide-react";

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  date?: string;
  timeSlot?: string;
  acceptPrivacy?: string;
}

interface ReservationFormProps {
  servicesList: DBService[];
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  service: "",
  date: "",
  timeSlot: "",
  notes: "",
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function openingHoursSummary(): string {
  // Agrupa los días con el mismo horario (L-V comparten horario)
  const parts: string[] = [];
  const weekdays = STUDIO_HOURS[1];
  if (weekdays) parts.push(`L-V ${weekdays.open}-${formatTime(weekdays.close)}`);
  const sat = STUDIO_HOURS[6];
  if (sat) parts.push(`${DAY_LABELS[6]} ${sat.open}-${formatTime(sat.close)}`);
  const sun = STUDIO_HOURS[0];
  if (sun) parts.push(`${DAY_LABELS[0]} ${sun.open}-${formatTime(sun.close)}`);
  return parts.join(" · ");
}

export default function ReservationForm({ servicesList }: ReservationFormProps) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("servicio") ?? "";

  // ── Estado ──
  const [formData, setFormData] = useState({ ...EMPTY_FORM, service: preselected });
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Disponibilidad horaria ──
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | undefined>();
  const [serviceDuration, setServiceDuration] = useState<number>(0);

  const turnstile = useTurnstile("dark");
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const today = todayInStudio();

  // Cargar slots disponibles cuando cambian servicio + fecha
  useEffect(() => {
    if (!formData.service || !formData.date) {
      setAvailableSlots([]);
      setSlotsMessage(undefined);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSlotsMessage(undefined);

    getAvailableSlots(formData.service, formData.date)
      .then((result) => {
        if (cancelled) return;
        setAvailableSlots(result.slots);
        setServiceDuration(result.duracion);
        setSlotsMessage(result.mensaje);
      })
      .catch(() => {
        if (!cancelled) setSlotsMessage("Error al cargar horarios. Inténtalo de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.service, formData.date]);

  // Llevar el foco al mensaje de éxito o de error para lectores de pantalla
  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (formError) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [formError]);

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

    if (!formData.timeSlot) newErrors.timeSlot = "Selecciona un horario";

    if (!acceptPrivacy) newErrors.acceptPrivacy = "Debes aceptar la política de privacidad";

    return newErrors;
  }

  // ── Actualizar campo ──
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Cambiar servicio o fecha invalida la hora elegida
      if (name === "service" || name === "date") next.timeSlot = "";
      return next;
    });
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (formError) setFormError(null);
  }

  function selectSlot(slot: string) {
    setFormData((prev) => ({ ...prev, timeSlot: slot }));
    setErrors((prev) => ({ ...prev, timeSlot: undefined }));
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
      document.getElementById(`res-${firstField}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await submitReservationAction({
        ...formData,
        acceptPrivacy,
        turnstileToken: turnstile.token ?? undefined,
      });

      if (!result.ok) {
        setFormError(result.error);
        // Si el horario se ocupó mientras tanto, recargamos la disponibilidad
        if (/horario|hora/i.test(result.error)) {
          setFormData((prev) => ({ ...prev, timeSlot: "" }));
          setAvailableSlots([]);
          getAvailableSlots(formData.service, formData.date).then((r) => {
            setAvailableSlots(r.slots);
            setSlotsMessage(r.mensaje);
          });
        }
        turnstile.reset();
        return;
      }

      setSubmitted(true);
      setFormData({ ...EMPTY_FORM });
      setAcceptPrivacy(false);
    } catch {
      setFormError("No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.");
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  }

  const selectedService = servicesList.find((s) => s.id === formData.service);
  const endTime =
    formData.timeSlot && serviceDuration > 0
      ? formatTime(minutesToTime(timeToMinutes(formData.timeSlot) + serviceDuration))
      : null;

  // ── Mensaje de éxito ──
  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="rounded-xl border border-accent/30 bg-card-bg p-8 text-center outline-none animate-fade-in"
      >
        <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-accent" aria-hidden="true" />
        <h2 className="text-xl font-black uppercase italic tracking-tight">¡Solicitud enviada!</h2>
        <p className="mt-3 text-sm text-muted">
          Hemos recibido tu solicitud. Te contactaremos por WhatsApp o email para confirmar
          la disponibilidad y cerrar los detalles de tu sesión.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://wa.me/34661652638"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#128C7E] hover:-translate-y-0.5"
          >
            Hablar por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded-lg border border-card-border px-6 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            Enviar otra solicitud
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
      className="space-y-5 rounded-xl border border-card-border bg-card-bg p-6 sm:p-8"
    >
      {/* Nombre */}
      <div>
        <label htmlFor="res-name" className="mb-1 block text-sm font-medium">
          Nombre <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="res-name"
          name="name"
          type="text"
          autoComplete="name"
          required
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
          Teléfono <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="res-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
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
          Email <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="res-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
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
          Servicio <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <select
          id="res-service"
          name="service"
          required
          value={formData.service}
          onChange={handleChange}
          aria-invalid={!!errors.service}
          aria-describedby={errors.service ? "res-service-error" : "res-service-hint"}
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
        {errors.service ? (
          <p id="res-service-error" className="mt-1 text-xs text-red-400">
            {errors.service}
          </p>
        ) : selectedService ? (
          <p id="res-service-hint" className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {selectedService.duracion_minutos} min · {selectedService.precio} €
          </p>
        ) : null}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="res-date" className="mb-1 block text-sm font-medium">
          Fecha deseada <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="res-date"
          name="date"
          type="date"
          required
          min={today}
          value={formData.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "res-date-error" : "res-date-hint"}
        />
        {errors.date ? (
          <p id="res-date-error" className="mt-1 text-xs text-red-400">
            {errors.date}
          </p>
        ) : (
          <p id="res-date-hint" className="mt-1 text-xs text-muted">
            Horario del estudio: {openingHoursSummary()}
          </p>
        )}
      </div>

      {/* Hora — Solo visible cuando hay servicio + fecha */}
      {formData.service && formData.date && (
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">
            Hora <span className="text-accent" aria-hidden="true">*</span>
          </legend>
          {loadingSlots ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted" role="status" aria-live="polite">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-hidden="true"
              />
              Cargando horarios disponibles...
            </div>
          ) : availableSlots.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Horas disponibles">
                {availableSlots.map((slot) => {
                  const selected = formData.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectSlot(slot)}
                      className={`min-h-[44px] rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                        selected
                          ? "border-accent bg-accent text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          : "border-card-border bg-card-bg text-foreground hover:border-accent/50 hover:bg-accent/10"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {endTime && (
                <p className="mt-2 text-xs text-muted" aria-live="polite">
                  Sesión de {serviceDuration} min — de {formData.timeSlot} a {endTime}
                </p>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300" role="status">
              {slotsMessage || "No hay horarios disponibles para esta fecha."}
            </p>
          )}
          {errors.timeSlot && (
            <p id="res-timeSlot" tabIndex={-1} className="mt-1 text-xs text-red-400">
              {errors.timeSlot}
            </p>
          )}
        </fieldset>
      )}

      {/* Observaciones */}
      <div>
        <label htmlFor="res-notes" className="mb-1 block text-sm font-medium">
          Observaciones <span className="text-xs font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="res-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Información adicional sobre tu proyecto, número de canciones, referencias, etc."
        />
      </div>

      {/* Política de Privacidad */}
      <div className="pt-1">
        <label className="group flex cursor-pointer items-start gap-3">
          <div className="relative mt-0.5 flex items-center">
            <input
              id="res-acceptPrivacy"
              type="checkbox"
              checked={acceptPrivacy}
              aria-invalid={!!errors.acceptPrivacy}
              aria-describedby={errors.acceptPrivacy ? "res-privacy-error" : undefined}
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
            </a>{" "}
            y autorizo el tratamiento de mis datos para gestionar mi reserva y enviarme
            comunicaciones relacionadas con la misma.
          </span>
        </label>
        {errors.acceptPrivacy && (
          <p id="res-privacy-error" className="mt-2 text-xs font-bold text-red-400">
            {errors.acceptPrivacy}
          </p>
        )}
      </div>

      <p className="text-xs text-muted">
        Esta es una solicitud de reserva: te contactaremos para confirmar disponibilidad y detalles.
      </p>

      <TurnstileWidget controller={turnstile} />

      <div ref={errorRef}>
        <FormAlert message={formError} />
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black"
              aria-hidden="true"
            />
            Enviando solicitud...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar solicitud de reserva
          </>
        )}
      </button>
    </form>
  );
}
