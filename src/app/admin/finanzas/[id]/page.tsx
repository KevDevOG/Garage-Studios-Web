import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import FinanceForm from "@/components/admin/FinanceForm";
import { FinanceMovement } from "@/app/actions/finanzas";
import { getActiveServices } from "@/app/actions/services";

export const metadata = {
  title: "Editar Movimiento - Finanzas",
};

export default async function EditarFinanzaPage(props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const params = await props.params;
  const { id } = params;

  const { data, error } = await supabase
    .from("finanza_movimiento")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    redirect("/admin/finanzas");
  }

  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Editar Movimiento" />
      <div className="mt-8 bg-card-bg p-6 rounded-xl border border-card-border">
        <FinanceForm initialData={data as FinanceMovement} services={services} />
      </div>
    </div>
  );
}
