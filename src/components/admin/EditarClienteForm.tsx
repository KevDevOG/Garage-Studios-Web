"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateCliente } from "@/app/actions/clientes";
import type { ClienteRow } from "@/app/actions/clientes";

export default function EditarClienteForm({
  cliente,
}: {
  cliente: ClienteRow;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCliente(cliente.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/clientes");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre *</label>
          <input
            name="nombre"
            type="text"
            required
            defaultValue={cliente.nombre}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={cliente.email || ""}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono</label>
          <input
            name="telefono"
            type="tel"
            defaultValue={cliente.telefono || ""}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Instagram</label>
          <input
            name="instagram"
            type="text"
            defaultValue={cliente.instagram || ""}
            className="w-full"
            placeholder="@usuario"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select
            name="estado"
            defaultValue={cliente.estado}
            className="w-full"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Origen</label>
          <select
            name="origen"
            defaultValue={cliente.origen}
            className="w-full"
          >
            <option value="web">Web</option>
            <option value="manual">Manual</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="referido">Referido</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Notas internas (solo admin)
        </label>
        <textarea
          name="notas"
          rows={3}
          defaultValue={cliente.notas || ""}
          className="w-full"
          placeholder="Notas sobre este cliente..."
        />
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </button>
        <Link
          href="/admin/clientes"
          className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-white"
        >
          Volver
        </Link>
      </div>
    </form>
  );
}
