import { formatEUR, plural } from "@/lib/format";
import { formatIsoDateEs } from "@/lib/dates";
import StatusBadge from "@/components/admin/StatusBadge";
import { EmptyState, LinkButton, Notice, Panel, table, cx } from "@/components/admin/ui";

/** Fila de `reserva` con el servicio unido, tal y como la devuelve getPendingPaymentReservations. */
export interface PendingReservation {
  id: string;
  nombre: string | null;
  fecha_reserva: string;
  precio: number | string | null;
  importe_pagado: number | string | null;
  estado_pago: string;
  servicio?: { nombre: string | null } | Array<{ nombre: string | null }> | null;
}

function toNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Importe pendiente de una reserva: precio menos lo cobrado, nunca negativo. */
function pendingAmount(r: PendingReservation): number {
  return Math.max(0, toNumber(r.precio) - toNumber(r.importe_pagado));
}

function serviceName(r: PendingReservation): string {
  const svc = Array.isArray(r.servicio) ? r.servicio[0] : r.servicio;
  return svc?.nombre || "Sin servicio";
}

const dateLabel = (iso: string) => formatIsoDateEs(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

/** Saldos por cobrar: reservas confirmadas o completadas con pago pendiente o parcial. */
export default function PendingCollections({
  reservations,
}: {
  /** null = la consulta falló (no se afirma que no haya cobros pendientes). */
  reservations: PendingReservation[] | null;
}) {
  if (reservations === null) {
    return (
      <Panel title="Por cobrar">
        <Notice title="No se pudieron cargar los cobros pendientes">
          Recarga la página para reintentarlo. El resto de cifras de esta pantalla sí están actualizadas.
        </Notice>
      </Panel>
    );
  }

  const rows = reservations.map((r) => ({ r, pending: pendingAmount(r) }));
  const total = rows.reduce((sum, row) => sum + row.pending, 0);

  return (
    <Panel
      title="Por cobrar"
      meta={reservations.length > 0 ? plural(reservations.length, "reserva", "reservas") : undefined}
      action={
        reservations.length > 0 ? (
          <p className="text-[13px] text-gs-soft">
            Total pendiente <span className="ml-1 text-[15px] font-semibold tabular-nums text-gs-amber">{formatEUR(total)}</span>
          </p>
        ) : undefined
      }
      flush
    >
      {reservations.length === 0 ? (
        <EmptyState
          title="No hay cobros pendientes"
          hint="Cuando una reserva confirmada o completada tenga pago pendiente o parcial, aparecerá aquí."
        />
      ) : (
        <div
          role="region"
          aria-label="Reservas con cobro pendiente"
          tabIndex={0}
          className="max-h-[26rem] overflow-y-auto focus-visible:outline-2 focus-visible:outline-gs-amber"
        >
          {/* Tabla en pantallas medianas y grandes */}
          <table className={cx(table.table, "hidden md:table")}>
            <thead>
              <tr>
                <th scope="col" className={table.th}>Cliente</th>
                <th scope="col" className={table.th}>Fecha</th>
                <th scope="col" className={table.th}>Servicio</th>
                <th scope="col" className={table.th}>Estado de pago</th>
                <th scope="col" className={cx(table.th, "text-right")}>Pendiente</th>
                <th scope="col" className={cx(table.th, "text-right")}>
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ r, pending }) => (
                <tr key={r.id} className={table.tr}>
                  <td className={cx(table.td, "font-medium")}>{r.nombre || "Sin nombre"}</td>
                  <td className={cx(table.td, "whitespace-nowrap tabular-nums text-gs-soft")}>{dateLabel(r.fecha_reserva)}</td>
                  <td className={cx(table.td, "text-gs-soft")}>{serviceName(r)}</td>
                  <td className={table.td}>
                    <StatusBadge type="pago" value={r.estado_pago} plain />
                  </td>
                  <td className={cx(table.td, table.num, "font-medium text-gs-amber")}>{formatEUR(pending)}</td>
                  <td className={cx(table.td, "text-right")}>
                    <LinkButton
                      href={`/admin/calendario/${r.id}`}
                      variant="ghost"
                      size="sm"
                      aria-label={`Abrir reserva de ${r.nombre || "cliente"} para registrar el cobro`}
                    >
                      Abrir reserva
                    </LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Lista apilada en móvil */}
          <ul className="divide-y divide-gs-line md:hidden">
            {rows.map(({ r, pending }) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-[14px] font-medium text-gs-paper">{r.nombre || "Sin nombre"}</p>
                  <p className="shrink-0 text-[14px] font-medium tabular-nums text-gs-amber">{formatEUR(pending)}</p>
                </div>
                <p className="mt-0.5 text-[13px] text-gs-soft">
                  {dateLabel(r.fecha_reserva)}, {serviceName(r)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <StatusBadge type="pago" value={r.estado_pago} plain />
                  <LinkButton
                    href={`/admin/calendario/${r.id}`}
                    variant="secondary"
                    size="sm"
                    aria-label={`Abrir reserva de ${r.nombre || "cliente"} para registrar el cobro`}
                  >
                    Abrir reserva
                  </LinkButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
