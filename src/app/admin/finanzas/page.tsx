import { Plus, Printer } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { LinkButton, Notice, Page } from "@/components/admin/ui";
import {
  getFinanceSummary,
  getFinanceMovementsResult,
  getFinanceYearOverview,
  getPendingPaymentReservations,
} from "@/app/actions/finanzas";
import type { PendingReservation } from "@/components/admin/finanzas/PendingCollections";
import { parsePeriod } from "@/lib/dates";
import FinanzasClient from "./FinanzasClient";

export const metadata = {
  title: "Finanzas - Admin",
};

export default async function FinanzasPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Sesión + lista de administradores, validada una vez por petición.
  const { user } = await getAdminSession();

  if (!user) {
    redirect("/admin/login");
  }

  const searchParams = await props.searchParams;
  const { month, year } = parsePeriod(searchParams.month, searchParams.year);
  const rawView = Array.isArray(searchParams.view) ? searchParams.view[0] : searchParams.view;
  const view: "mensual" | "anual" = rawView === "anual" ? "anual" : "mensual";

  // Solo se consulta lo que la vista activa necesita, y en paralelo.
  const [summaryRes, movementsRes, yearOverviewRes, pendingRes] = await Promise.all([
    view === "mensual" ? getFinanceSummary(month, year) : Promise.resolve(null),
    view === "mensual" ? getFinanceMovementsResult(month, year) : Promise.resolve(null),
    view === "anual" ? getFinanceYearOverview(year) : Promise.resolve(null),
    view === "mensual" ? getPendingPaymentReservations() : Promise.resolve([]),
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
  const otherView = view === "anual" ? "mensual" : "anual";

  return (
    <Page width="wide">
      <AdminNav
        title="Finanzas"
        description="Ingresos, gastos y cobros pendientes del estudio."
        actions={
          hasError ? undefined : (
            <>
              <LinkButton
                href={`/admin/finanzas/informe?month=${month}&year=${year}`}
                target="_blank"
                variant="secondary"
                className="max-sm:hidden"
              >
                <Printer aria-hidden />
                Informe imprimible
              </LinkButton>
              <LinkButton href="/admin/finanzas/nuevo" variant="primary">
                <Plus aria-hidden />
                Nuevo movimiento
              </LinkButton>
            </>
          )
        }
      />
      {hasError ? (
        <Notice title="No se pudieron cargar los datos financieros">
          <p className="max-w-prose">
            Ocurrió un error al consultar la información de {view === "anual" ? "la vista anual" : "la vista mensual"}.
            Por seguridad, no se muestran totales en cero hasta restablecer la conexión.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LinkButton href={retryHref} variant="primary">
              Reintentar
            </LinkButton>
            <LinkButton href={`/admin/finanzas?view=${otherView}&month=${month}&year=${year}`} variant="secondary">
              Ver vista {otherView}
            </LinkButton>
          </div>
        </Notice>
      ) : (
        <FinanzasClient
          view={view}
          month={month}
          year={year}
          summary={summaryRes?.ok ? summaryRes.data : null}
          movements={movementsRes?.ok ? movementsRes.data : []}
          annualSummary={yearOverviewRes?.ok ? yearOverviewRes.data.summary : null}
          annualInsights={yearOverviewRes?.ok ? yearOverviewRes.data.insights : null}
          pending={pendingRes as PendingReservation[] | null}
        />
      )}
    </Page>
  );
}
