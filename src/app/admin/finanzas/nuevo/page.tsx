import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import FinanceForm from "@/components/admin/FinanceForm";
import { getActiveServices } from "@/app/actions/services";

export const metadata = {
  title: "Nuevo Movimiento - Finanzas",
};

export default async function NuevaFinanzaPage(props: { searchParams: Promise<any> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const searchParams = await props.searchParams;
  const services = await getActiveServices();

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Añadir Movimiento" />
      <div className="mt-8 bg-card-bg p-6 rounded-xl border border-card-border">
        <FinanceForm initialData={searchParams as any} services={services} />
      </div>
    </div>
  );
}
