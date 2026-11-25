"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createManualReservation } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ClienteSearch from "@/components/admin/ClienteSearch";
import { Badge, Field, FormActions, Notice, Panel, buttonClass } from "./ui";

interface ClienteSeleccion {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}

export default function NuevaReservaForm({
  servicesList,
  initialFecha,
  initialCliente = "",
}: {
  servicesList: DBService[];
  /** Fecha ISO (YYYY-MM-DD) con la que arranca el formulario. */
  initialFecha: string;
  /** Nombre que llega por URL desde la ficha del cliente. */
  initialCliente?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [precio, setPrecio] = useState<string>("");
  const [duracion, setDuracion] = useState<string>("60");

  // Autorrelleno desde cliente existente
  const [nombre, setNombre] = useState(initialCliente);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedServiceId(serviceId);
    const service = servicesList.find((s) => s.id === serviceId);
    if (service) {
      setPrecio(String(service.precio));
      if (service.duracion_minutos) setDuracion(String(service.duracion_minutos));
    }
  };

  const handleClienteSelect = (cliente: ClienteSeleccion | null) => {
    if (!cliente) return;
    setNombre(cliente.nombre);
    setEmail(cliente.email || "");
    setTelefono(cliente.telefono || "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createManualReservation(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        toast.success("Reserva creada como pendiente.");
        router.push("/admin/calendario");
      } catch {
        setError("No se pudo crear la reserva. Inténtalo de nuevo.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-busy={isPending} className="space-y-4">
      <Panel title="Cliente">
        <div className="space-y-4">
          <ClienteSearch onSelect={handleClienteSelect} initialQuery={initialCliente} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre del cliente" htmlFor={id("nombre")} required>
              <input
                id={id("nombre")}
                name="nombre"
                type="text"
                required
                minLength={2}
                maxLength={120}
                autoComplete="off"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Field>
            <Field label="Correo electrónico" htmlFor={id("email")} required>
              <input
                id={id("email")}
                name="email"
                type="email"
                required
                placeholder="cliente@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Teléfono" htmlFor={id("telefono")} required>
              <input
                id={id("telefono")}
                name="telefono"
                type="tel"
                inputMode="tel"
                required
                placeholder="+34 600 000 000"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel title="Sesión">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Servicio" htmlFor={id("servicio")} required>
              <select
                id={id("servicio")}
                name="servicio_id"
                required
                value={selectedServiceId}
                onChange={handleServiceChange}
              >
                <option value="">Seleccionar servicio</option>
                {servicesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracion_minutos} min, {s.precio} €)
                  </option>
                ))}
              </select>
            </Field>

            <div className="min-w-0">
              <span id={id("estado")} className="mb-1.5 block text-[13px] font-medium text-gs-paper">
                Estado
              </span>
              <input type="hidden" name="estado" value="pendiente" />
              <div
                aria-labelledby={id("estado")}
                className="flex min-h-10 items-center rounded-md border border-gs-line bg-gs-sunken px-3"
              >
                <Badge tone="amber" plain>
                  Pendiente
                </Badge>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-gs-faint">
                Siempre se crea como pendiente. Al confirmarla se envía un correo al cliente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Fecha" htmlFor={id("fecha")} required>
              <input id={id("fecha")} name="fecha_reserva" type="date" required defaultValue={initialFecha} />
            </Field>
            <Field label="Hora de inicio" htmlFor={id("hora")} required>
              <input id={id("hora")} name="hora_inicio" type="time" required step="1800" />
            </Field>
            <Field label="Duración (min)" htmlFor={id("duracion")} required>
              <input
                id={id("duracion")}
                name="duracion_minutos"
                type="number"
                inputMode="numeric"
                required
                min="30"
                max="1440"
                step="30"
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
              />
            </Field>
            <Field label="Precio final (€)" htmlFor={id("precio")} required>
              <input
                id={id("precio")}
                name="precio"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel title="Notas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Observaciones" htmlFor={id("observaciones")} hint="Lo que el cliente quiere que sepamos.">
            <textarea
              id={id("observaciones")}
              name="observaciones"
              rows={3}
              maxLength={1000}
              aria-describedby={`${id("observaciones")}-ayuda`}
            />
          </Field>
          <Field label="Notas internas" htmlFor={id("notas")} hint="Solo se ven en el panel.">
            <textarea
              id={id("notas")}
              name="notas_admin"
              rows={3}
              maxLength={2000}
              aria-describedby={`${id("notas")}-ayuda`}
            />
          </Field>
        </div>
      </Panel>

      {error && <Notice tone="bad">{error}</Notice>}

      <FormActions>
        <button type="submit" disabled={isPending} className={buttonClass("primary")}>
          {isPending ? "Guardando…" : "Crear reserva"}
        </button>
        <Link href="/admin/calendario" className={buttonClass("ghost")}>
          Cancelar
        </Link>
      </FormActions>
    </form>
  );
}
