"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Download, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { FinanceMovement, deleteFinanceMovement } from "@/app/actions/finanzas";
import StatusBadge from "@/components/admin/StatusBadge";
import { EmptyState, LinkButton, Panel, buttonClass, table, cx } from "@/components/admin/ui";
import { formatEUR, plural } from "@/lib/format";
import { formatIsoDateEs } from "@/lib/dates";

const RESERVA_PREFIX = "reserva-";

const ICON_BUTTON =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md text-gs-soft transition-colors hover:bg-gs-raised hover:text-gs-paper sm:size-8 [&_svg]:size-4";

type TipoFilter = "todos" | "ingreso" | "gasto";

const dateLabel = (iso: string) => formatIsoDateEs(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

function Amount({ mov, className }: { mov: FinanceMovement; className?: string }) {
  const income = mov.tipo === "ingreso";
  return (
    <span className={cx("tabular-nums font-medium", income ? "text-gs-ok" : "text-gs-bad", className)}>
      <span className="sr-only">{income ? "Ingreso: " : "Gasto: "}</span>
      {income ? "+" : "-"}
      {formatEUR(mov.importe)}
    </span>
  );
}

function RowActions({
  mov,
  isConfirming,
  isPending,
  onAskDelete,
  onCancel,
  onConfirm,
}: {
  mov: FinanceMovement;
  isConfirming: boolean;
  isPending: boolean;
  onAskDelete: (id: string) => void;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  if (mov.id.startsWith(RESERVA_PREFIX)) {
    // Cobros de reservas: se gestionan desde la propia reserva.
    return mov.reserva_id ? (
      <Link
        href={`/admin/calendario/${mov.reserva_id}`}
        aria-label={`Ver la reserva de ${mov.concepto}`}
        title="Ver reserva"
        className={ICON_BUTTON}
      >
        <ExternalLink aria-hidden />
      </Link>
    ) : null;
  }

  if (isConfirming) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
        <span className="text-[13px] text-gs-soft">¿Eliminar?</span>
        <button type="button" onClick={() => onConfirm(mov.id)} disabled={isPending} className={buttonClass("danger", "sm")}>
          {isPending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button type="button" onClick={onCancel} disabled={isPending} className={buttonClass("ghost", "sm")}>
          No
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Link href={`/admin/finanzas/${mov.id}`} aria-label={`Editar ${mov.concepto}`} title="Editar" className={ICON_BUTTON}>
        <Pencil aria-hidden />
      </Link>
      <button
        type="button"
        onClick={() => onAskDelete(mov.id)}
        aria-label={`Eliminar ${mov.concepto}`}
        title="Eliminar"
        className={cx(ICON_BUTTON, "text-gs-bad hover:text-gs-bad")}
      >
        <Trash2 aria-hidden />
      </button>
    </span>
  );
}

/** Movimientos del mes: filtro por tipo, eliminación con confirmación y exportación. */
export default function MovementsPanel({ movements }: { movements: FinanceMovement[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterTipo, setFilterTipo] = useState<TipoFilter>("todos");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await deleteFinanceMovement(id);
        if (!res.ok) {
          toast.error(res.error);
        } else {
          toast.success("Movimiento eliminado");
          router.refresh();
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo eliminar el movimiento. Inténtalo de nuevo.");
      } finally {
        setConfirmingId(null);
      }
    });
  };

  const filteredMovements = useMemo(
    () => movements.filter((m) => (filterTipo === "todos" ? true : m.tipo === filterTipo)),
    [movements, filterTipo],
  );

  const rowProps = (mov: FinanceMovement) => ({
    mov,
    isConfirming: confirmingId === mov.id,
    isPending,
    onAskDelete: setConfirmingId,
    onCancel: () => setConfirmingId(null),
    onConfirm: handleDelete,
  });

  return (
    <Panel
      title="Movimientos del mes"
      meta={plural(filteredMovements.length, "movimiento", "movimientos")}
      flush
      action={
        <div className="flex flex-wrap items-center gap-2 py-1">
          <label htmlFor="finanzas-filtro-tipo" className="sr-only">
            Filtrar por tipo de movimiento
          </label>
          <select
            id="finanzas-filtro-tipo"
            value={filterTipo}
            onChange={(e) => {
              const v = e.target.value;
              setFilterTipo(v === "ingreso" || v === "gasto" ? v : "todos");
            }}
            className="w-auto py-1.5 text-[13px] sm:min-h-8 sm:py-1"
          >
            <option value="todos">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
          <LinkButton href="/admin/exportaciones" variant="secondary" size="sm">
            <Download aria-hidden />
            Exportar
          </LinkButton>
        </div>
      }
    >
      {filteredMovements.length === 0 ? (
        <EmptyState
          title={movements.length === 0 ? "No hay movimientos en este periodo" : "Ningún movimiento coincide con el filtro"}
          hint={
            movements.length === 0
              ? "Los cobros de reservas aparecen solos. Registra aquí gastos u otros ingresos."
              : "Cambia el tipo para ver el resto de movimientos del mes."
          }
          action={
            movements.length === 0 ? (
              <LinkButton href="/admin/finanzas/nuevo" variant="secondary" size="sm">
                <Plus aria-hidden />
                Registrar primer movimiento
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Tabla en pantallas medianas y grandes */}
          <div className="hidden overflow-x-auto md:block">
            <table className={table.table}>
              <thead>
                <tr>
                  <th scope="col" className={table.th}>Fecha</th>
                  <th scope="col" className={table.th}>Concepto</th>
                  <th scope="col" className={table.th}>Categoría</th>
                  <th scope="col" className={table.th}>Método</th>
                  <th scope="col" className={cx(table.th, "text-right")}>Importe</th>
                  <th scope="col" className={cx(table.th, "text-right")}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((mov) => (
                  <tr key={mov.id} className={table.tr}>
                    <td className={cx(table.td, "whitespace-nowrap tabular-nums text-gs-soft")}>{dateLabel(mov.fecha)}</td>
                    <td className={cx(table.td, "max-w-[22rem] break-words")}>{mov.concepto}</td>
                    <td className={cx(table.td, "text-gs-soft")}>{mov.categoria}</td>
                    <td className={table.td}>
                      {mov.metodo_pago ? (
                        <StatusBadge type="pago" value={mov.metodo_pago} plain />
                      ) : (
                        <span className="text-gs-faint">—</span>
                      )}
                    </td>
                    <td className={cx(table.td, table.num, "whitespace-nowrap")}>
                      <Amount mov={mov} />
                    </td>
                    <td className={cx(table.td, "text-right")}>
                      <RowActions {...rowProps(mov)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista apilada en móvil */}
          <ul className="divide-y divide-gs-line md:hidden">
            {filteredMovements.map((mov) => (
              <li key={mov.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-[14px] font-medium text-gs-paper">{mov.concepto}</p>
                  <Amount mov={mov} className="shrink-0 text-[14px]" />
                </div>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gs-soft">
                    <span className="tabular-nums">{dateLabel(mov.fecha)}</span>
                    <span>{mov.categoria}</span>
                    {mov.metodo_pago && <StatusBadge type="pago" value={mov.metodo_pago} plain />}
                  </div>
                  <div className="shrink-0">
                    <RowActions {...rowProps(mov)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
