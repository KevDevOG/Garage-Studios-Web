import Link from "next/link";
import { Pencil, Repeat } from "lucide-react";
import { formatIsoDateEs } from "@/lib/dates";
import { formatEUR } from "@/lib/format";
import { formatTime } from "@/lib/schedule";
import type { SessionRowData } from "./agenda/events";
import { occupiesSlot } from "./agenda/events";
import DeleteReservationButton from "./DeleteReservationButton";
import QuickActionButtons from "./QuickActionButtons";
import StatusBadge from "./StatusBadge";
import { Badge, buttonClass, cx } from "./ui";

const SHORT_DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/**
 * Fila de una sesión en la agenda: hora, cliente, servicio, estados y el
 * siguiente paso (confirmar, completar, abrir, eliminar). Sirve para reservas
 * y para los bloques de un pack, que remiten a su reserva.
 */
export default function CalendarReservationCard({
  reservation: res,
  showDate = false,
}: {
  reservation: SessionRowData;
  /** Muestra el día junto a la hora (listas que mezclan varios días). */
  showDate?: boolean;
}) {
  const active = occupiesSlot(res.estado);
  const detailHref = res.is_block
    ? res.parent_reserva_id
      ? `/admin/calendario/${res.parent_reserva_id}`
      : null
    : `/admin/calendario/${res.id}`;
  const servicio = res.is_block ? res.block_title : res.servicio?.nombre;
  const hasPrice = typeof res.precio === "number" && Number.isFinite(res.precio);
  const isRecurring = (res.cliente_total_reservas || 0) > 1;

  return (
    <li className="flex flex-col gap-x-4 gap-y-2 px-4 py-3 lg:flex-row lg:items-center">
      {/* Hora */}
      <div className="flex shrink-0 items-baseline gap-2 lg:w-[7.25rem] lg:flex-col lg:gap-0.5">
        {showDate && (
          <span className="text-[12px] text-gs-soft">{formatIsoDateEs(res.fecha_reserva, SHORT_DAY)}</span>
        )}
        <span className={cx("text-[14px] font-semibold", active ? "text-gs-paper" : "text-gs-faint line-through")}>
          {formatTime(res.hora_inicio)}
          <span className="font-normal text-gs-faint"> a {formatTime(res.hora_fin)}</span>
        </span>
      </div>

      {/* Cliente, servicio y estados */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {detailHref ? (
            <Link
              href={detailHref}
              className="break-words text-[14px] font-semibold text-gs-paper underline-offset-4 hover:underline"
            >
              {res.nombre}
            </Link>
          ) : (
            <span className="break-words text-[14px] font-semibold text-gs-paper">{res.nombre}</span>
          )}
          {isRecurring && (
            <span title="Cliente recurrente" className="inline-flex text-gs-faint">
              <Repeat aria-hidden className="size-3.5" />
              <span className="sr-only">Cliente recurrente</span>
            </span>
          )}
          <StatusBadge type="reserva" value={res.estado} plain />
          {res.is_block && (
            <Badge tone="neutral" plain>
              Sesión de pack
            </Badge>
          )}
          {res.estado_pago && active && (
            <span className="inline-flex items-center gap-1">
              <StatusBadge type="pago" value={res.estado_pago} plain />
              {res.estado_pago === "parcial" && res.importe_pagado ? (
                <span className="text-[12px] text-gs-faint">({formatEUR(res.importe_pagado)})</span>
              ) : null}
            </span>
          )}
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-gs-soft">
          <span>
            {servicio || "Servicio sin especificar"}
            {hasPrice && (
              <span className="text-gs-paper">
                {", "}
                {formatEUR(res.precio)}
                {res.is_block && <span className="text-gs-faint"> (total del pack)</span>}
              </span>
            )}
          </span>
          {res.telefono && (
            <a href={`tel:${res.telefono.replace(/\s+/g, "")}`} className="text-gs-faint hover:text-gs-paper">
              <span className="sr-only">Teléfono: </span>
              {res.telefono}
            </a>
          )}
          {res.email && (
            <a href={`mailto:${res.email}`} className="break-all text-gs-faint hover:text-gs-paper">
              <span className="sr-only">Correo: </span>
              {res.email}
            </a>
          )}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {!res.is_block && <QuickActionButtons id={res.id} currentStatus={res.estado} nombre={res.nombre} />}
        {detailHref && (
          <Link
            href={detailHref}
            aria-label={res.is_block ? `Ver el pack de ${res.nombre}` : `Abrir la reserva de ${res.nombre}`}
            title={res.is_block ? "Ver el pack" : "Abrir la reserva"}
            className={buttonClass("ghost", "sm", "w-10 px-0 sm:w-8")}
          >
            <Pencil aria-hidden />
          </Link>
        )}
        <DeleteReservationButton id={res.id} isBlock={Boolean(res.is_block)} nombre={res.nombre} />
      </div>
    </li>
  );
}
