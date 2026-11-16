import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getFinanceSummary, getFinanceMovements, getFinanceYearOverview } from "@/app/actions/finanzas";
import { parsePeriod } from "@/lib/dates";
import FinanzasClient from "./FinanzasClient";

export const metadata = {
  title: "Finanzas - Admin",
};

export default async function FinanzasPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const { month, year } = parsePeriod(searchParams.month, searchParams.year);
  const rawView = Array.isArray(searchParams.view) ? searchParams.view[0] : searchParams.view;
  const view: "mensual" | "anual" = rawView === "anual" ? "anual" : "mensual";

  // Solo se consulta lo que la vista activa necesita, y en paralelo.
  const [summary, movements, yearOverview] = await Promise.all([
    view === "mensual" ? getFinanceSummary(month, year) : Promise.resolve(null),
    view === "mensual" ? getFinanceMovements(month, year) : Promise.resolve(null),
    view === "anual" ? getFinanceYearOverview(year) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Finanzas" />
      <FinanzasClient
        view={view}
        month={month}
        year={year}
        summary={summary}
        movements={movements ?? []}
        annualSummary={yearOverview?.summary ?? null}
        annualInsights={yearOverview?.insights ?? null}
      />
    </div>
  );
}
