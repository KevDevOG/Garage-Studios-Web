import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import FinanceForm from "@/components/admin/FinanceForm";
import { Page, Panel } from "@/components/admin/ui";
import { FinanceMovement } from "@/app/actions/finanzas";
import { getActiveServices } from "@/app/actions/services";

export const metadata = {
  title: "Editar movimiento - Finanzas",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarFinanzaPage(props: { params: Promise<{ id: string }> }) {
  // Sesión + lista de administradores, validada una vez por petición.
  const { supabase, user } = await getAdminSession();

  if (!user) redirect("/admin/login");

  const params = await props.params;
  const { id } = params;

  // Las filas "reserva-<uuid>" del listado no son movimientos editables.
  if (id.startsWith("reserva-") && UUID_RE.test(id.slice("reserva-".length))) {
    redirect(`/admin/calendario/${id.slice("reserva-".length)}`);
  }
  if (!UUID_RE.test(id)) redirect("/admin/finanzas");

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    redirect("/admin/finanzas");
  }

  const services = await getActiveServices();

  return (
    <Page width="narrow">
      <AdminNav title="Editar movimiento" description="Cambia los datos del movimiento o elimínalo." />
      <Panel>
        <FinanceForm initialData={data as FinanceMovement} services={services} />
      </Panel>
    </Page>
  );
}
