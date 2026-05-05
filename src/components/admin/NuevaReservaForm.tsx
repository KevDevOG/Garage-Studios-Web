"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createManualReservation } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ClienteSearch from "@/components/admin/ClienteSearch";

export default function NuevaReservaForm({
  servicesList,
}: {
  servicesList: DBService[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [precio, setPrecio] = useState(0);

  // Client auto-fill state
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedServiceId(id);
    const service = servicesList.find((s) => s.id === id);
    if (service) {
      setPrecio(Number(service.precio));
    }
  };

  const handleClienteSelect = (
    cliente: {
      id: string;
      nombre: string;
      email: string | null;
      telefono: string | null;
    } | null
  ) => {
    if (cliente) {
      setNombre(cliente.nombre);
      setEmail(cliente.email || "");
      setTelefono(cliente.telefono || "");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createManualReservation(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/calendario");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      {/* Buscar cliente existente */}
      <ClienteSearch onSelect={handleClienteSelect} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Servicio *</label>
          <select
            name="servicio_id"
            required
            onChange={handleServiceChange}
            className="w-full border-card-border bg-card-bg rounded-md p-2"
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
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <input type="hidden" name="estado" value="pendiente" />
          <div className="flex items-center gap-2 w-full border border-card-border bg-card-bg rounded-md p-2 text-amber-400 text-sm font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
            Pendiente
          </div>
          <p className="mt-1 text-[10px] text-muted">Las reservas siempre se crean como pendientes. Confirma después para enviar el email al cliente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nombre del cliente *
          </label>
          <input
            name="nombre"
            type="text"
            required
            className="w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input
            name="email"
            type="email"
            required
            className="w-full"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono *</label>
          <input
            name="telefono"
            type="tel"
            required
            className="w-full"
            placeholder="+34 600 000 000"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Precio Final (€) *
          </label>
          <input
            name="precio"
            type="number"
            step="0.01"
            required
            value={precio}
            onChange={(e) => setPrecio(parseFloat(e.target.value))}
            className="w-full border-accent/30 focus:border-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Fecha *</label>
          <input
            name="fecha_reserva"
            type="date"
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Hora inicio *
          </label>
          <input
            name="hora_inicio"
            type="time"
            required
            className="w-full"
            step="1800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Duración (min) *
          </label>
          <input
            name="duracion_minutos"
            type="number"
            required
            min="30"
            step="30"
            defaultValue="60"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Observaciones</label>
        <textarea name="observaciones" rows={2} className="w-full" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Notas internas (solo admin)
        </label>
        <textarea name="notas_admin" rows={2} className="w-full" />
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Crear Reserva"}
        </button>
        <Link
          href="/admin/calendario"
          className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
