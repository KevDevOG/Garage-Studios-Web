import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getAuditLogs, AuditLogFilters } from "@/app/actions/auditoria";
import AuditoriaClient from "./AuditoriaClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Auditoría - Admin",
};

export default async function AuditoriaPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const filters: AuditLogFilters = {
    query: params.query as string,
    entidad: params.entidad as string,
    accion: params.accion as string,
    fecha: params.fecha as any,
    order: params.order as any || "desc",
  };

  const logs = await getAuditLogs(filters);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Auditoría" />
      <AuditoriaClient initialLogs={logs} />
    </div>
  );
}
