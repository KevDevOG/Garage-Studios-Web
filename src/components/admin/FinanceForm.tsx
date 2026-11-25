"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFinanceMovement, updateFinanceMovement, deleteFinanceMovement, FinanceMovement } from "@/app/actions/finanzas";
import type { DBService } from "@/app/actions/services";
import { todayInStudio } from "@/lib/dates";
import { Field, FormActions, Notice, buttonClass } from "@/components/admin/ui";

const CAT_GASTOS = ["Alquiler", "Luz", "Internet", "Material", "Equipos", "Software", "Publicidad", "Transporte", "Mantenimiento", "Otros gastos"];
const METODOS = ["efectivo", "transferencia", "tarjeta", "bizum", "otro"];
const CAT_INGRESO_SIN_SERVICIO = "Otros";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Valores iniciales (ya validados por la página) al crear un movimiento nuevo. */
export interface FinancePreset {
  tipo?: "ingreso" | "gasto";
  categoria?: string;
  concepto?: string;
  importe?: number;
  fecha?: string;
  reserva_id?: string;
  cliente_id?: string;
}

type FormService = Pick<DBService, "id" | "nombre">;

export default function FinanceForm({
  initialData,
  preset,
  services = [],
}: {
  /** Movimiento existente: activa el modo edición. */
  initialData?: FinanceMovement;
  /** Valores iniciales para un movimiento nuevo. */
  preset?: FinancePreset;
  services?: FormService[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isEditing = !!initialData?.id;
  const base: FinancePreset | FinanceMovement | undefined = initialData ?? preset;

  const presetTipo = base?.tipo ?? "ingreso";
  const presetConcepto = base?.concepto ?? "";
  const presetImporte = base?.importe ?? "";
  const presetReservaId = base?.reserva_id ?? "";
  const presetClienteId = base?.cliente_id ?? "";
  const presetServicioId = initialData?.servicio_id ?? "";
  const presetFecha = base?.fecha ?? todayInStudio();

  const [tipo, setTipo] = useState<"ingreso" | "gasto">(presetTipo);

  // La categoría del ingreso se deriva del servicio elegido; el select de
  // gastos arranca vacío para obligar a elegir una categoría.
  const initialServiceName = services.find((s) => s.id === presetServicioId)?.nombre;
  const [ingresoCategoria, setIngresoCategoria] = useState<string>(
    initialData?.tipo === "ingreso"
      ? initialData.categoria
      : initialServiceName ?? preset?.categoria ?? CAT_INGRESO_SIN_SERVICIO
  );
  const initialGastoCat = base?.tipo === "gasto" ? base.categoria ?? "" : "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = initialData
          ? await updateFinanceMovement(initialData.id, formData)
          : await createFinanceMovement(formData);

        if (!res.ok) {
          setError(res.error);
        } else {
          router.push("/admin/finanzas");
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo guardar el movimiento. Inténtalo de nuevo.");
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await deleteFinanceMovement(initialData.id);
        if (!res.ok) {
          setError(res.error);
          setIsConfirmingDelete(false);
        } else {
          router.push("/admin/finanzas");
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo eliminar el movimiento. Inténtalo de nuevo.");
        setIsConfirmingDelete(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Relaciones ocultas */}
      <input type="hidden" name="reserva_id" value={presetReservaId} />
      <input type="hidden" name="cliente_id" value={presetClienteId} />
      {tipo === "ingreso" && <input type="hidden" name="categoria" value={ingresoCategoria} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo" htmlFor="fin-tipo" required>
          <select
            id="fin-tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value === "gasto" ? "gasto" : "ingreso")}
            className="w-full"
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </Field>
        <Field label="Fecha" htmlFor="fin-fecha" required>
          <input id="fin-fecha" type="date" name="fecha" required defaultValue={presetFecha} className="w-full" />
        </Field>

        <Field label="Importe (€)" htmlFor="fin-importe" required hint="Mayor que 0, con hasta dos decimales.">
          <input
            id="fin-importe"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            name="importe"
            required
            defaultValue={presetImporte}
            className="w-full tabular-nums"
            placeholder="0.00"
            aria-describedby="fin-importe-ayuda"
          />
        </Field>

        {tipo === "ingreso" ? (
          services.length > 0 ? (
            <Field
              label="Servicio"
              htmlFor="fin-servicio"
              hint="La categoría del ingreso se toma del servicio elegido."
            >
              <select
                id="fin-servicio"
                name="servicio_id"
                className="w-full"
                defaultValue={presetServicioId}
                aria-describedby="fin-servicio-ayuda"
                onChange={(e) => {
                  const svc = services.find((s) => s.id === e.target.value);
                  setIngresoCategoria(svc ? svc.nombre : CAT_INGRESO_SIN_SERVICIO);
                }}
              >
                <option value="">Otro (sin servicio asociado)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="min-w-0">
              <p className="mb-1.5 text-[13px] font-medium text-gs-paper">Servicio</p>
              <p className="text-[13px] text-gs-soft">No hay servicios activos.</p>
              <input type="hidden" name="servicio_id" value="" />
            </div>
          )
        ) : (
          <Field label="Categoría" htmlFor="fin-categoria" required>
            <select id="fin-categoria" name="categoria" required defaultValue={initialGastoCat} className="w-full">
              <option value="" disabled>Selecciona una categoría</option>
              {initialGastoCat && !CAT_GASTOS.includes(initialGastoCat) && (
                <option value={initialGastoCat}>{initialGastoCat}</option>
              )}
              {CAT_GASTOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        )}

        <Field label="Concepto" htmlFor="fin-concepto" required className="sm:col-span-2">
          <input
            id="fin-concepto"
            type="text"
            name="concepto"
            required
            maxLength={120}
            defaultValue={presetConcepto}
            className="w-full"
            placeholder="Ej.: grabación de voz, alquiler del local"
          />
        </Field>

        <Field label="Método de pago" htmlFor="fin-metodo">
          <select id="fin-metodo" name="metodo_pago" defaultValue={initialData?.metodo_pago || ""} className="w-full">
            <option value="">No especificado</option>
            {METODOS.map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
          </select>
        </Field>

        <Field
          label="Notas"
          htmlFor="fin-notas"
          hint="Opcional. Hasta 1000 caracteres."
          className="sm:col-span-2"
        >
          <textarea
            id="fin-notas"
            name="notas"
            maxLength={1000}
            defaultValue={initialData?.notas || initialData?.descripcion || ""}
            rows={3}
            className="w-full"
            placeholder="Detalles opcionales"
            aria-describedby="fin-notas-ayuda"
          />
        </Field>
      </div>

      {error && <Notice title="No se pudo completar la acción">{error}</Notice>}

      <FormActions>
        {isEditing &&
          (isConfirmingDelete ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-gs-soft">¿Eliminar este movimiento?</span>
              <button type="button" onClick={handleDelete} disabled={isPending} className={buttonClass("danger")}>
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button type="button" onClick={() => setIsConfirmingDelete(false)} disabled={isPending} className={buttonClass("ghost")}>
                No
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setIsConfirmingDelete(true)} disabled={isPending} className={buttonClass("danger")}>
              Eliminar movimiento
            </button>
          ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => router.back()} className={buttonClass("ghost")}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={buttonClass("primary")}>
            {isPending ? "Guardando..." : "Guardar movimiento"}
          </button>
        </div>
      </FormActions>
    </form>
  );
}
