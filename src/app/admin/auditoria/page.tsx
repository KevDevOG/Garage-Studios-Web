import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { Page } from "@/components/admin/ui";
import { getAuditLogs, AuditLogFilters } from "@/app/actions/auditoria";
import AuditoriaClient from "./AuditoriaClient";
import { getAdminSession } from "@/lib/auth";

export const metadata = {
  title: "Auditoría - Admin",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user } = await getAdminSession();

  if (!user) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const first = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const fechaParam = first(params.fecha);
  const filters: AuditLogFilters = {
    query: first(params.query),
    entidad: first(params.entidad),
    accion: first(params.accion),
    fecha:
      fechaParam === "hoy" || fechaParam === "7dias" || fechaParam === "este_mes" ? fechaParam : "todo",
    order: first(params.order) === "asc" ? "asc" : "desc",
  };

  const logs = await getAuditLogs(filters);

  return (
    <Page width="wide">
      <AdminNav
        title="Auditoría"
        description="Registro de las acciones realizadas en el panel. Se muestran hasta 200 registros según los filtros."
      />
      <AuditoriaClient initialLogs={logs} />
    </Page>
  );
}
