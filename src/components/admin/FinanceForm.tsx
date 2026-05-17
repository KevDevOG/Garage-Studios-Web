"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFinanceMovement, updateFinanceMovement, deleteFinanceMovement, FinanceMovement } from "@/app/actions/finanzas";

const CAT_GASTOS = ["Alquiler", "Luz", "Internet", "Material", "Equipos", "Software", "Publicidad", "Transporte", "Mantenimiento", "Otros gastos"];
const METODOS = ["efectivo", "transferencia", "tarjeta", "bizum", "otro"];

export default function FinanceForm({ 
  initialData,
  services = []
}: { 
  initialData?: FinanceMovement & { searchParams?: any };
  services?: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Determine initial values, either from actual movement (editing) or searchParams (creating from reservation)
  const isEditing = !!initialData?.id;
  
  // If no initialData.id, but we have searchParams mixed in (we can pass it as a trick), use them.
  const presetTipo = initialData?.tipo || "ingreso";
  const presetConcepto = initialData?.concepto || "";
  const presetImporte = initialData?.importe || "";
  const presetReservaId = initialData?.reserva_id || "";
  const presetClienteId = initialData?.cliente_id || "";
  const presetServicioId = initialData?.servicio_id || "";
  const presetFecha = initialData?.fecha || new Date().toISOString().split('T')[0];

  const [tipo, setTipo] = useState<"ingreso" | "gasto">(presetTipo as "ingreso" | "gasto");
  
  const initialCat = initialData?.categoria || (presetTipo === "ingreso" && services.length > 0 ? services[0].nombre : "Otros");
  const [catInput, setCatInput] = useState(initialCat);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = isEditing 
        ? await updateFinanceMovement(initialData.id, formData)
        : await createFinanceMovement(formData);

      if (res.error) {
        setError(res.error);
      } else {
        router.push("/admin/finanzas");
      }
    });
  };

  const handleDelete = () => {
    if(!isEditing || !confirm("¿Eliminar este movimiento?")) return;
    startTransition(async () => {
      const res = await deleteFinanceMovement(initialData.id);
      if (res.error) setError(res.error);
      else router.push("/admin/finanzas");
    });
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Hidden relations */}
        <input type="hidden" name="reserva_id" value={presetReservaId} />
        <input type="hidden" name="cliente_id" value={presetClienteId} />
        {tipo !== "ingreso" && <input type="hidden" name="servicio_id" value={presetServicioId} />}
        {tipo === "ingreso" && <input type="hidden" name="categoria" value={catInput} />}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Tipo *</label>
            <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "ingreso"|"gasto")} className="w-full">
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Fecha *</label>
            <input type="date" name="fecha" required defaultValue={presetFecha} className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium mb-1">Importe (€) *</label>
            <input type="number" step="0.01" min="0.01" name="importe" required defaultValue={presetImporte} className="w-full" placeholder="0.00" />
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-medium mb-1">Categoría / Servicio *</label>
            {tipo === "ingreso" ? (
              services && services.length > 0 ? (
                <select 
                  name="servicio_id" 
                  className="w-full" 
                  defaultValue={presetServicioId}
                  onChange={(e) => {
                    const svc = services.find(s => s.id === e.target.value);
                    if (svc) {
                      setCatInput(svc.nombre);
                    } else {
                      setCatInput("Otros");
                    }
                  }}
                >
                  <option value="">Otro (Sin servicio asociado)</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              ) : (
                <>
                  <p className="text-sm text-muted mb-2">No hay servicios activos.</p>
                  <input type="hidden" name="servicio_id" value="" />
                </>
              )
            ) : (
              <select name="categoria" required defaultValue={initialCat} className="w-full">
                {initialCat && !CAT_GASTOS.includes(initialCat) && (
                  <option value={initialCat}>{initialCat}</option>
                )}
                {CAT_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Concepto *</label>
          <input type="text" name="concepto" required defaultValue={presetConcepto} className="w-full" placeholder="Ej: Grabación Voz / Alquiler Local" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Método de Pago</label>
            <select name="metodo_pago" defaultValue={initialData?.metodo_pago || ""} className="w-full">
              <option value="">No especificado</option>
              {METODOS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Descripción / Notas Adicionales</label>
          <textarea name="notas" defaultValue={initialData?.notas || initialData?.descripcion || ""} rows={3} className="w-full" placeholder="Detalles opcionales..."></textarea>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-between items-center pt-4 border-t border-card-border">
          {isEditing ? (
            <button type="button" onClick={handleDelete} disabled={isPending} className="text-sm text-red-400 hover:underline">
              Eliminar Movimiento
            </button>
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
