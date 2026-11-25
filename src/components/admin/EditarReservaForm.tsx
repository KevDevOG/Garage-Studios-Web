"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { updateReservation, deleteReservation } from "@/app/actions/calendario";
import type { ReservationRow, ReservationBlock } from "@/app/actions/calendario";
import type { DBService } from "@/app/actions/services";
import ReservationBlockManager from "@/components/admin/ReservationBlockManager";
import ComunicacionesReserva from "@/components/admin/reservas/ComunicacionesReserva";
import { formatTime } from "@/lib/schedule";
import { formatDateTimeEs } from "@/lib/dates";
import { formatEUR, plural } from "@/lib/format";
import { RESERVATION_STATES, type PaymentState } from "@/lib/reservation-states";
import { RESERVA_STATUS } from "@/lib/status-colors";
import StatusBadge from "./StatusBadge";
import { Field, FormActions, Notice, Panel, buttonClass, cx } from "./ui";

export default function EditarReservaForm({
  reservation,
  blocks,
  servicesList,
}: {
  reservation: ReservationRow;
  blocks: ReservationBlock[];
  servicesList: DBService[];
  /** Reservado para futuras integraciones con finanzas. */
  hasFinance?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [precioFinal, setPrecioFinal] = useState<number>(Number(reservation.precio) || 0);
  const [estadoPago, setEstadoPago] = useState<PaymentState>(reservation.estado_pago || "pendiente");
  const [importePagado, setImportePagado] = useState<number>(Number(reservation.importe_pagado) || 0);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateReservation(reservation.id, formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        toast.success("Reserva actualizada.");
        router.push("/admin/calendario");
      } catch {
        setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteReservation(reservation.id);
        if ("error" in result) {
          const message = result.error ?? "No se pudo eliminar la reserva.";
          setError(message);
          toast.error(message);
          setConfirmDelete(false);
          return;
        }
        toast.success("Reserva eliminada.");
        router.push("/admin/calendario");
      } catch {
        setError("No se pudo eliminar la reserva. Inténtalo de nuevo.");
        toast.error("No se pudo eliminar la reserva.");
        setConfirmDelete(false);
      }
    });
  };

  // Comprobar si el servicio es pack
  const currentService = servicesList.find((s) => s.id === reservation.servicio_id);
  const isPack = currentService?.es_pack || false;
  // Solo para mostrar: no se envía.
  const restante = Math.max(0, precioFinal - (importePagado || 0));

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} aria-busy={isPending} className="space-y-4">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Columna principal */}
          <div className="min-w-0 space-y-4">
            <Panel title="Sesión">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Estado"
                    htmlFor={id("estado")}
                    hint="Al confirmar, cancelar o completar se envía un correo al cliente."
                  >
                    <select
                      id={id("estado")}
                      name="estado"
                      defaultValue={reservation.estado}
                      aria-describedby={`${id("estado")}-ayuda`}
                    >
                      {RESERVATION_STATES.map((estado) => (
                        <option key={estado} value={estado}>
                          {RESERVA_STATUS[estado]?.label ?? estado}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Servicio" htmlFor={id("servicio")}>
                    <select id={id("servicio")} name="servicio_id" defaultValue={reservation.servicio_id}>
                      {servicesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Fecha" htmlFor={id("fecha")} required>
                    <input
                      id={id("fecha")}
                      name="fecha_reserva"
                      type="date"
                      required
                      defaultValue={reservation.fecha_reserva}
                    />
                  </Field>
                  <Field label="Hora de inicio" htmlFor={id("hora")}>
                    <input
                      id={id("hora")}
                      name="hora_inicio"
                      type="time"
                      step="1800"
                      defaultValue={reservation.hora_inicio?.slice(0, 5) || ""}
                    />
                  </Field>
                  <Field label="Duración (min)" htmlFor={id("duracion")}>
                    <input
                      id={id("duracion")}
                      name="duracion_minutos"
                      type="number"
                      inputMode="numeric"
                      min="30"
                      max="1440"
                      step="30"
                      defaultValue={reservation.duracion_minutos || 60}
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel
              title="Cliente"
              meta={
                typeof reservation.cliente_total_reservas === "number"
                  ? plural(reservation.cliente_total_reservas, "reserva", "reservas")
                  : undefined
              }
              action={
                reservation.cliente_id ? (
                  <Link href={`/admin/clientes/${reservation.cliente_id}`} className={buttonClass("ghost", "sm")}>
                    Ver ficha
                    <ExternalLink aria-hidden />
                  </Link>
                ) : undefined
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre" htmlFor={id("nombre")} required className="sm:col-span-2">
                  <input
                    id={id("nombre")}
                    name="nombre"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    defaultValue={reservation.nombre}
                  />
                </Field>
                <Field label="Correo electrónico" htmlFor={id("email")} required>
                  <input id={id("email")} name="email" type="email" required defaultValue={reservation.email} />
                </Field>
                <Field label="Teléfono" htmlFor={id("telefono")} required>
                  <input
                    id={id("telefono")}
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    required
                    defaultValue={reservation.telefono}
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Notas">
              <div className="space-y-4">
                <Field label="Observaciones del cliente" htmlFor={id("observaciones")}>
                  <textarea
                    id={id("observaciones")}
                    name="observaciones"
                    rows={3}
                    maxLength={1000}
                    defaultValue={reservation.observaciones || ""}
                  />
                </Field>
                <Field label="Notas internas" htmlFor={id("notas")} hint="Solo se ven en el panel.">
                  <textarea
                    id={id("notas")}
                    name="notas_admin"
                    rows={3}
                    maxLength={2000}
                    defaultValue={reservation.notas_admin || ""}
                    placeholder="Notas privadas sobre esta reserva"
                    aria-describedby={`${id("notas")}-ayuda`}
                  />
                </Field>
              </div>
            </Panel>
          </div>

          {/* Columna lateral */}
          <div className="min-w-0 space-y-4">
            <Panel
              title="Cobro"
              action={<StatusBadge type="pago" value={estadoPago} plain />}
            >
              <div className="space-y-4">
                <Field
                  label="Precio final (€)"
                  htmlFor={id("precio")}
                  required
                  hint={`Precio base del servicio: ${
                    currentService?.precio !== undefined ? formatEUR(Number(currentService.precio)) : "--"
                  }`}
                >
                  <input
                    id={id("precio")}
                    name="precio"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={precioFinal}
                    onChange={(e) => setPrecioFinal(Number(e.target.value))}
                    aria-describedby={`${id("precio")}-ayuda`}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Field label="Estado del pago" htmlFor={id("estado-pago")}>
                    <select
                      id={id("estado-pago")}
                      name="estado_pago"
                      value={estadoPago}
                      onChange={(e) => {
                        const val = e.target.value as PaymentState;
                        setEstadoPago(val);
                        if (val === "pagado") setImportePagado(precioFinal);
                        if (val === "pendiente") setImportePagado(0);
                      }}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="parcial">Pago parcial (señal)</option>
                      <option value="pagado">Pagado total</option>
                    </select>
                  </Field>
                  <Field label="Importe pagado (€)" htmlFor={id("importe")}>
                    <input
                      id={id("importe")}
                      name="importe_pagado"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={importePagado}
                      onChange={(e) => setImportePagado(Number(e.target.value))}
                      aria-describedby={`${id("resumen")}`}
                    />
                  </Field>
                </div>

                <dl id={id("resumen")} className="space-y-1.5 border-t border-gs-line pt-3 text-[13px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-gs-soft">Precio</dt>
                    <dd className="tabular-nums text-gs-paper">{formatEUR(precioFinal)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-gs-soft">Cobrado</dt>
                    <dd className="tabular-nums text-gs-paper">{formatEUR(importePagado || 0)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="font-medium text-gs-paper">Pendiente de cobro</dt>
                    <dd className={cx("tabular-nums font-semibold", restante > 0 ? "text-gs-amber" : "text-gs-ok")}>
                      {formatEUR(restante)}
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <ComunicacionesReserva reservation={reservation} servicioNombre={currentService?.nombre} />

            <Panel title="Registro">
              <dl className="space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-gs-soft">Origen</dt>
                  <dd className="text-right text-gs-paper">{reservation.origen || "web"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gs-soft">Horario</dt>
                  <dd className="text-right tabular-nums text-gs-paper">
                    {formatTime(reservation.hora_inicio)} - {formatTime(reservation.hora_fin)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gs-soft">Creada</dt>
                  <dd className="text-right tabular-nums text-gs-paper">{formatDateTimeEs(reservation.created_at)}</dd>
                </div>
                {reservation.updated_at && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gs-soft">Actualizada</dt>
                    <dd className="text-right tabular-nums text-gs-paper">{formatDateTimeEs(reservation.updated_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-gs-soft">ID</dt>
                  <dd className="min-w-0 break-all text-right font-mono text-[12px] text-gs-faint">{reservation.id}</dd>
                </div>
              </dl>
            </Panel>
          </div>
        </div>

        {error && <Notice tone="bad">{error}</Notice>}

        <FormActions>
          <button type="submit" disabled={isPending} className={buttonClass("primary")}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link href="/admin/calendario" className={buttonClass("ghost")}>
            Volver
          </Link>
          <div className="ml-auto">
            {confirmDelete ? (
              <div role="group" aria-label="Confirmar eliminación" className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-gs-soft">¿Eliminar la reserva?</span>
                <button type="button" onClick={handleDelete} disabled={isPending} className={buttonClass("danger")}>
                  {isPending ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                  className={buttonClass("ghost")}
                >
                  No
                </button>
              </div>
            ) : (
              <button type="button" onClick={handleDelete} disabled={isPending} className={buttonClass("danger")}>
                Eliminar reserva
              </button>
            )}
          </div>
        </FormActions>
      </form>

      {/* Sesiones del pack (solo si el servicio es un pack). Fuera del formulario: lleva el suyo. */}
      {isPack && <ReservationBlockManager reservaId={reservation.id} blocks={blocks} />}
    </div>
  );
}
