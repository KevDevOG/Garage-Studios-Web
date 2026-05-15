import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getFinanceSummary, getFinanceMovements, getFinanceStatsByYear } from "@/app/actions/finanzas";
import Link from "next/link";
import FinanzasClient from "./FinanzasClient";

export const metadata = {
  title: "Finanzas - Admin",
};

export default async function FinanzasPage(props: { searchParams: Promise<{ month?: string; year?: string; view?: "mensual" | "anual" }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const now = new Date();
  const currentMonth = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const currentYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const currentView = searchParams.view || "mensual";

  const summary = await getFinanceSummary(currentMonth, currentYear);
  const movements = await getFinanceMovements(currentMonth, currentYear);
  const yearlyStats = await getFinanceStatsByYear(currentYear);
  
  // Datos adicionales para vista anual
  const { getFinanceYearlySummary, getFinanceAnnualInsights } = await import("@/app/actions/finanzas");
  const annualSummary = await getFinanceYearlySummary(currentYear);
  const annualInsights = await getFinanceAnnualInsights(currentYear);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Finanzas" />
      <FinanzasClient 
        view={currentView as "mensual" | "anual"}
        month={currentMonth} 
        year={currentYear} 
        summary={summary} 
        movements={movements} 
        yearlyStats={yearlyStats} 
        annualSummary={annualSummary}
        annualInsights={annualInsights}
      />
    </div>
);
}
