"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCliente } from "@/app/actions/clientes";
import type { ClienteRow } from "@/app/actions/clientes";
import { Field, FormActions, Notice, buttonClass } from "./ui";

export default function EditarClienteForm({
  cliente,
}: {
  cliente: ClienteRow;
}) {
  const router = useRouter();
  const uid = useId();
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

  const id = (name: string) => `${uid}-${name}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Nombre" htmlFor={id("nombre")} required>
          <input id={id("nombre")} name="nombre" type="text" required defaultValue={cliente.nombre} className="w-full" />
        </Field>
        <Field label="Email" htmlFor={id("email")}>
          <input id={id("email")} name="email" type="email" defaultValue={cliente.email || ""} className="w-full" />
        </Field>
        <Field label="Teléfono" htmlFor={id("telefono")}>
          <input id={id("telefono")} name="telefono" type="tel" defaultValue={cliente.telefono || ""} className="w-full" />
        </Field>
        <Field label="Instagram" htmlFor={id("instagram")}>
          <input
            id={id("instagram")}
            name="instagram"
            type="text"
            defaultValue={cliente.instagram || ""}
            className="w-full"
            placeholder="@usuario"
          />
        </Field>
        <Field label="Estado" htmlFor={id("estado")}>
          <select id={id("estado")} name="estado" defaultValue={cliente.estado} className="w-full">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </Field>
        <Field label="Origen" htmlFor={id("origen")}>
          <select id={id("origen")} name="origen" defaultValue={cliente.origen} className="w-full">
            <option value="web">Web</option>
            <option value="manual">Manual</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="referido">Referido</option>
            <option value="otro">Otro</option>
          </select>
        </Field>
      </div>

      <Field label="Observaciones" htmlFor={id("notas")} hint="Solo visibles para el equipo.">
        <textarea
          id={id("notas")}
          name="notas"
          rows={3}
          defaultValue={cliente.notas || ""}
          className="w-full resize-y"
          aria-describedby={`${id("notas")}-ayuda`}
        />
      </Field>

      {error && <Notice title="No se han podido guardar los cambios">{error}</Notice>}

      <FormActions>
        <button type="submit" disabled={isPending} className={buttonClass("secondary", "md")}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </FormActions>
    </form>
  );
}
