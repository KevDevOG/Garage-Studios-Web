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
import { parsePeriod } from "@/lib/dates";

export const metadata = {
  title: "Clientes - Admin",
};

export default async function ClientesPage(props: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const view = first(searchParams.view) === "yearly" ? "yearly" : "monthly";
  const { month, year } = parsePeriod(searchParams.month, searchParams.year);
  const query = (first(searchParams.q) ?? "").trim().slice(0, 80);

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
      
      <ClientesClient initialQuery={query} 
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
