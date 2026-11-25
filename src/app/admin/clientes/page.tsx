import AdminNav from "@/components/admin/AdminNav";
import { Page } from "@/components/admin/ui";
import {
  getClientes,
  getClientesMetrics,
  getTopClientesByRevenue,
  getTopClientesByReservations,
  getClientesYearEvolution,
} from "@/app/actions/clientes";
import ClientesClient from "./ClientesClient";
import ClientesPeriodo from "@/components/admin/clientes/ClientesPeriodo";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { parsePeriod } from "@/lib/dates";
import { plural } from "@/lib/format";

export const metadata = {
  title: "Clientes - Admin",
};

export default async function ClientesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Sesión + lista de administradores, validada una vez por petición.
  const { user } = await getAdminSession();
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
    view === "yearly" ? getClientesYearEvolution(year) : Promise.resolve([]),
  ]);

  return (
    <Page width="wide">
      <AdminNav
        title="Clientes"
        description={`${plural(allClientes.length, "cliente", "clientes")}${query ? " con esa búsqueda" : " en total"}`}
        actions={<ClientesPeriodo view={view} month={month} year={year} query={query} />}
      />
      <ClientesClient
        initialQuery={query}
        view={view}
        month={month}
        year={year}
        metrics={metrics}
        topByRevenue={topRevenue}
        topByReservations={topReservations}
        clientes={allClientes}
        evolution={evolution}
      />
    </Page>
  );
}
