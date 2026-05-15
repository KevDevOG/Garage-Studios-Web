import AdminNav from "@/components/admin/AdminNav";
import { 
  getClientes, 
  getClientesMetrics, 
  getTopClientesByRevenue, 
  getTopClientesByReservations,
  getClientesYearEvolution 
} from "@/app/actions/clientes";
import ClientesClient from "./ClientesClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Clientes - Admin",
};

export default async function ClientesPage(props: { 
  searchParams: Promise<{ q?: string; month?: string; year?: string; view?: string }> 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const now = new Date();
  const view = searchParams.view === "yearly" ? "yearly" : "monthly";
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const query = searchParams.q || "";

  const selectedMonth = view === "monthly" ? month : null;

  // Paralelizar fetching
  const [metrics, topRevenue, topReservations, allClientes, evolution] = await Promise.all([
    getClientesMetrics(selectedMonth, year),
    getTopClientesByRevenue(selectedMonth, year),
    getTopClientesByReservations(selectedMonth, year),
    getClientes(query),
    view === "yearly" ? getClientesYearEvolution(year) : Promise.resolve([])
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <AdminNav title="Clientes" />
      
      <ClientesClient 
        view={view}
        month={month} 
        year={year} 
        metrics={metrics}
        topByRevenue={topRevenue}
        topByReservations={topReservations}
        clientes={allClientes}
        evolution={evolution}
      />
    </section>
  );
}
