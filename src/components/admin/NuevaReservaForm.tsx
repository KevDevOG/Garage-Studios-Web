"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createManualReservation } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ClienteSearch from "@/components/admin/ClienteSearch";
import FormAlert from "@/components/ui/FormAlert";
import { todayInStudio } from "@/lib/dates";

interface ClienteSeleccion {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}

export default function NuevaReservaForm({ servicesList }: { servicesList: DBService[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [precio, setPrecio] = useState<string>("");
  const [duracion, setDuracion] = useState<string>("60");

  // Autorrelleno desde cliente existente
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedServiceId(id);
    const service = servicesList.find((s) => s.id === id);
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
    <form
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-5 rounded-xl border border-card-border bg-card-bg p-6"
    >
      {/* Buscar cliente existente */}
      <ClienteSearch onSelect={handleClienteSelect} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nr-servicio" className="mb-1 block text-sm font-medium">
            Servicio <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <select
            id="nr-servicio"
            name="servicio_id"
            required
            value={selectedServiceId}
            onChange={handleServiceChange}
          >
            <option value="">Seleccionar...</option>
            {servicesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.duracion_minutos} min — {s.precio} €)
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Estado</span>
          <input type="hidden" name="estado" value="pendiente" />
          <div className="flex min-h-[44px] w-full items-center gap-2 rounded-md border border-card-border bg-card-bg px-3 text-sm font-medium text-amber-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            Pendiente
          </div>
          <p className="mt-1 text-xs text-muted">
            Las reservas siempre se crean como pendientes. Confírmala después para enviar el email al cliente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nr-nombre" className="mb-1 block text-sm font-medium">
            Nombre del cliente <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="nr-nombre"
            name="nombre"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="off"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nr-email" className="mb-1 block text-sm font-medium">
            Email <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="nr-email"
            name="email"
            type="email"
            required
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nr-telefono" className="mb-1 block text-sm font-medium">
            Teléfono <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="nr-telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            required
            placeholder="+34 600 000 000"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nr-precio" className="mb-1 block text-sm font-medium">
            Precio final (€) <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="nr-precio"
            name="precio"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="border-accent/30 focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nr-fecha" className="mb-1 block text-sm font-medium">
            Fecha <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input id="nr-fecha" name="fecha_reserva" type="date" required defaultValue={todayInStudio()} />
        </div>
        <div>
          <label htmlFor="nr-hora" className="mb-1 block text-sm font-medium">
            Hora inicio <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input id="nr-hora" name="hora_inicio" type="time" required step="1800" />
        </div>
        <div>
          <label htmlFor="nr-duracion" className="mb-1 block text-sm font-medium">
            Duración (min) <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="nr-duracion"
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
        </div>
      </div>

      <div>
        <label htmlFor="nr-observaciones" className="mb-1 block text-sm font-medium">
          Observaciones
        </label>
        <textarea id="nr-observaciones" name="observaciones" rows={2} maxLength={1000} />
      </div>

      <div>
        <label htmlFor="nr-notas" className="mb-1 block text-sm font-medium">
          Notas internas (solo admin)
        </label>
        <textarea id="nr-notas" name="notas_admin" rows={2} maxLength={2000} />
      </div>

      <FormAlert message={error} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Crear reserva"}
        </button>
        <Link
          href="/admin/calendario"
          className="inline-flex items-center justify-center rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
