"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFinanceMovement, updateFinanceMovement, deleteFinanceMovement, FinanceMovement } from "@/app/actions/finanzas";
import type { DBService } from "@/app/actions/services";
import { todayInStudio } from "@/lib/dates";

const CAT_GASTOS = ["Alquiler", "Luz", "Internet", "Material", "Equipos", "Software", "Publicidad", "Transporte", "Mantenimiento", "Otros gastos"];
const METODOS = ["efectivo", "transferencia", "tarjeta", "bizum", "otro"];
const CAT_INGRESO_SIN_SERVICIO = "Otros";

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
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Hidden relations */}
        <input type="hidden" name="reserva_id" value={presetReservaId} />
        <input type="hidden" name="cliente_id" value={presetClienteId} />
        {tipo === "ingreso" && <input type="hidden" name="categoria" value={ingresoCategoria} />}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fin-tipo" className="block text-xs font-medium mb-1">Tipo *</label>
            <select id="fin-tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value === "gasto" ? "gasto" : "ingreso")} className="w-full">
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>
          <div>
            <label htmlFor="fin-fecha" className="block text-xs font-medium mb-1">Fecha *</label>
            <input id="fin-fecha" type="date" name="fecha" required defaultValue={presetFecha} className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="fin-importe" className="block text-xs font-medium mb-1">Importe (€) *</label>
            <input id="fin-importe" type="number" step="0.01" min="0.01" name="importe" required defaultValue={presetImporte} className="w-full" placeholder="0.00" />
          </div>
          <div className="col-span-2 md:col-span-2">
            {tipo === "ingreso" ? (
              <>
                <label htmlFor="fin-servicio" className="block text-xs font-medium mb-1">Servicio</label>
                {services.length > 0 ? (
                  <select
                    id="fin-servicio"
                    name="servicio_id"
                    className="w-full"
                    defaultValue={presetServicioId}
                    onChange={(e) => {
                      const svc = services.find((s) => s.id === e.target.value);
                      setIngresoCategoria(svc ? svc.nombre : CAT_INGRESO_SIN_SERVICIO);
                    }}
                  >
                    <option value="">Otro (Sin servicio asociado)</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <p id="fin-servicio" className="text-sm text-muted mb-2">No hay servicios activos.</p>
                    <input type="hidden" name="servicio_id" value="" />
                  </>
                )}
              </>
            ) : (
              <>
                <label htmlFor="fin-categoria" className="block text-xs font-medium mb-1">Categoría *</label>
                <select id="fin-categoria" name="categoria" required defaultValue={initialGastoCat} className="w-full">
                  <option value="" disabled>Selecciona una categoría</option>
                  {initialGastoCat && !CAT_GASTOS.includes(initialGastoCat) && (
                    <option value={initialGastoCat}>{initialGastoCat}</option>
                  )}
                  {CAT_GASTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="fin-concepto" className="block text-xs font-medium mb-1">Concepto *</label>
          <input id="fin-concepto" type="text" name="concepto" required maxLength={120} defaultValue={presetConcepto} className="w-full" placeholder="Ej: Grabación Voz / Alquiler Local" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fin-metodo" className="block text-xs font-medium mb-1">Método de Pago</label>
            <select id="fin-metodo" name="metodo_pago" defaultValue={initialData?.metodo_pago || ""} className="w-full">
              <option value="">No especificado</option>
              {METODOS.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="fin-notas" className="block text-xs font-medium mb-1">Descripción / Notas Adicionales</label>
          <textarea id="fin-notas" name="notas" maxLength={1000} defaultValue={initialData?.notas || initialData?.descripcion || ""} rows={3} className="w-full" placeholder="Detalles opcionales..."></textarea>
        </div>

        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-between items-center pt-4 border-t border-card-border">
          {isEditing ? (
            isConfirmingDelete ? (
              <span className="inline-flex items-center gap-3 text-sm">
                <span className="text-muted">¿Eliminar este movimiento?</span>
                <button type="button" onClick={handleDelete} disabled={isPending} className="font-medium text-red-500 hover:text-red-400 hover:underline disabled:opacity-50">
                  {isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button type="button" onClick={() => setIsConfirmingDelete(false)} disabled={isPending} className="text-muted hover:text-white hover:underline disabled:opacity-50">
                  No
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setIsConfirmingDelete(true)} disabled={isPending} className="text-sm text-red-400 hover:underline">
                Eliminar Movimiento
              </button>
            )
          ) : <div></div>}

          <div className="flex gap-4">
            <button type="button" onClick={() => router.back()} className="text-sm text-muted hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="bg-accent text-black px-6 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50">
              {isPending ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
