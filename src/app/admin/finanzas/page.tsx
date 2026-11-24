import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getFinanceSummary, getFinanceMovementsResult, getFinanceYearOverview } from "@/app/actions/finanzas";
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
  const [summaryRes, movementsRes, yearOverviewRes] = await Promise.all([
    view === "mensual" ? getFinanceSummary(month, year) : Promise.resolve(null),
    view === "mensual" ? getFinanceMovementsResult(month, year) : Promise.resolve(null),
    view === "anual" ? getFinanceYearOverview(year) : Promise.resolve(null),
  ]);

  const hasError =
    view === "mensual"
      ? !summaryRes?.ok || !movementsRes?.ok
      : !yearOverviewRes?.ok;

  if (summaryRes && !summaryRes.ok) {
    console.error("[finanzas] Error cargando resumen mensual:", summaryRes.error);
  }
  if (movementsRes && !movementsRes.ok) {
    console.error("[finanzas] Error cargando movimientos mensuales:", movementsRes.error);
  }
  if (yearOverviewRes && !yearOverviewRes.ok) {
    console.error("[finanzas] Error cargando resumen anual:", yearOverviewRes.error);
  }

  const retryHref = `/admin/finanzas?view=${view}&month=${month}&year=${year}`;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Finanzas" />
      {hasError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-card-bg p-8 text-center shadow-lg sm:p-12"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">
            No se pudieron cargar los datos financieros
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Ocurrió un error al consultar la información de {view === "anual" ? "la vista anual" : "la vista mensual"}.
            Por seguridad, no se muestran totales en cero hasta restablecer la conexión.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={retryHref}
              className="rounded-lg bg-accent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover"
            >
              Reintentar
            </Link>
            <Link
              href={`/admin/finanzas?view=${view === "anual" ? "mensual" : "anual"}&month=${month}&year=${year}`}
              className="rounded-lg border border-card-border bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
            >
              Ver vista {view === "anual" ? "mensual" : "anual"}
            </Link>
          </div>
        </div>
      ) : (
        <FinanzasClient
          view={view}
          month={month}
          year={year}
          summary={summaryRes?.ok ? summaryRes.data : null}
          movements={movementsRes?.ok ? movementsRes.data : []}
          annualSummary={yearOverviewRes?.ok ? yearOverviewRes.data.summary : null}
          annualInsights={yearOverviewRes?.ok ? yearOverviewRes.data.insights : null}
        />
      )}
    </div>
  );
}
