import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Auditoría - Admin",
};

interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACCION_COLORS: Record<string, string> = {
  creación: "bg-green-500/20 text-green-400",
  edición: "bg-blue-500/20 text-blue-400",
  eliminación: "bg-red-500/20 text-red-400",
  cambio_estado: "bg-yellow-500/20 text-yellow-400",
  activación: "bg-emerald-500/20 text-emerald-400",
  desactivación: "bg-orange-500/20 text-orange-400",
  subida: "bg-purple-500/20 text-purple-400",
};

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: logs, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const auditLogs = (logs as AuditLogEntry[] | null) || [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Auditoría" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Últimas {auditLogs.length} acciones registradas en el panel
          </p>
        </div>

        {/* Logs */}
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-400">
              Error al cargar los logs. Asegúrate de haber ejecutado la migración 008_security_rls.sql.
            </p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card-bg p-12 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm text-muted">No hay acciones registradas todavía.</p>
            <p className="text-xs text-muted mt-1">Los cambios que hagas en el panel aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-black/20 text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Entidad</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {auditLogs.map((log) => {
                    const colorClass = ACCION_COLORS[log.accion] || "bg-white/10 text-white/70";
                    const date = new Date(log.created_at);
                    const formattedDate = date.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = date.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium">{formattedDate}</div>
                          <div className="text-[10px] text-muted">{formattedTime}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium capitalize">{log.entidad}</span>
                          {log.entidad_id && (
                            <div className="text-[10px] text-muted font-mono">{log.entidad_id.slice(0, 8)}…</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-white/80 max-w-xs truncate" title={log.descripcion || ""}>
                            {log.descripcion || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {log.metadata ? (
                            <details className="cursor-pointer">
                              <summary className="text-[10px] text-accent hover:underline">Ver</summary>
                              <pre className="mt-1 text-[10px] text-muted bg-black/30 p-2 rounded max-w-xs overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-[10px] text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
