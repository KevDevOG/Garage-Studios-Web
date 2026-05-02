import AdminNav from "@/components/admin/AdminNav";
import NuevaReservaForm from "@/components/admin/NuevaReservaForm";
import { getActiveServices } from "@/app/actions/services";

export default async function NuevaReservaPage() {
  const servicesList = await getActiveServices();

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <AdminNav title="Nueva Reserva Manual" />
      <NuevaReservaForm servicesList={servicesList} />
    </section>
  );
}
