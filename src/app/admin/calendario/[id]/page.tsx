import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EditarReservaForm from "@/components/admin/EditarReservaForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { Page } from "@/components/admin/ui";
import { getReservation, getReservationBlocks } from "@/app/actions/calendario";
import { getActiveServices } from "@/app/actions/services";
import { checkFinanceMovementExistsForReservation } from "@/app/actions/finanzas";
import { formatIsoDateEs } from "@/lib/dates";
import { formatTime } from "@/lib/schedule";

export default async function EditarReservaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [reservation, blocks, servicesList, hasFinance] = await Promise.all([
    getReservation(id),
    getReservationBlocks(id),
    getActiveServices(),
    checkFinanceMovementExistsForReservation(id)
  ]);

  if (!reservation) {
    redirect("/admin/calendario");
  }

  const servicio = servicesList.find((s) => s.id === reservation.servicio_id)?.nombre ?? reservation.servicio?.nombre;

  return (
    <Page width="wide">
      <AdminNav
        title={`Reserva de ${reservation.nombre}`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge type="reserva" value={reservation.estado} />
            <span>
              {servicio ? `${servicio}, ` : ""}
              {formatIsoDateEs(reservation.fecha_reserva, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {reservation.hora_inicio ? `, ${formatTime(reservation.hora_inicio)} - ${formatTime(reservation.hora_fin)}` : ""}
            </span>
          </span>
        }
      />
      <EditarReservaForm
        reservation={reservation}
        blocks={blocks}
        servicesList={servicesList}
        hasFinance={hasFinance}
      />
    </Page>
  );
}
