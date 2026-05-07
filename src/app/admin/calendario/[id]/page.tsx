import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EditarReservaForm from "@/components/admin/EditarReservaForm";
import { getReservation, getReservationBlocks } from "@/app/actions/calendario";
import { getActiveServices } from "@/app/actions/services";
import { checkFinanceMovementExistsForReservation } from "@/app/actions/finanzas";

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

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <AdminNav title="Editar Reserva" />
      <EditarReservaForm
        reservation={reservation}
        blocks={blocks}
        servicesList={servicesList}
        hasFinance={hasFinance}
      />
    </section>
  );
}
