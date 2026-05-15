import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getClienteById, getClienteCommercialStats, getClienteNotas } from "@/app/actions/clientes";
import { createClient } from "@/lib/supabase/server";
import EditarClienteForm from "@/components/admin/EditarClienteForm";
import ClienteTagsEditor from "@/components/admin/ClienteTagsEditor";
import ClienteNotas from "@/components/admin/ClienteNotas";
import ClienteStatsCards from "@/components/admin/ClienteStatsCards";
import ClienteQuickActions from "@/components/admin/ClienteQuickActions";
import Link from "next/link";
import { ChevronLeft, History, User, CreditCard } from "lucide-react";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await getClienteById(id);
  if (!cliente) notFound();

  const [commercialStats, notas] = await Promise.all([
    getClienteCommercialStats(id),
    getClienteNotas(id)
  ]);

  // Obtener historial de reservas del cliente
  const supabase = await createClient();
  const { data: reservas } = await supabase
    .from("reserva")
    .select("*, servicio(nombre)")
    .eq("cliente_id", id)
    .is("deleted_at", null)
    .order("fecha_reserva", { ascending: false })
    .limit(50);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link 
          href="/admin/clientes" 
          className="flex items-center gap-2 text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a Clientes
        </Link>
        <AdminNav title={cliente.nombre} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* COLUMNA IZQUIERDA: Stats y CRM */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Métricas Principales */}
          <ClienteStatsCards stats={commercialStats} />

          {/* Acciones Rápidas */}
          <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-accent" /> Gestión de Cliente
            </h3>
            <ClienteQuickActions 
              nombre={cliente.nombre}
              email={cliente.email}
              telefono={cliente.telefono}
              instagram={cliente.instagram}
            />
          </div>

          {/* Historial de Reservas */}
          <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> Historial de Reservas
              </h3>
            </div>
            
            <div className="divide-y divide-white/5">
              {!reservas || reservas.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-muted italic">No hay reservas registradas.</p>
                </div>
              ) : (
                reservas.map((res) => (
                  <Link
                    key={res.id}
                    href={`/admin/calendario/${res.id}`}
                    className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/5 p-2 rounded-lg text-center min-w-[60px]">
                        <p className="text-[10px] font-black text-accent uppercase leading-none">
                          {new Date(res.fecha_reserva + "T00:00:00").toLocaleString("es-ES", { month: 'short' })}
                        </p>
                        <p className="text-lg font-black text-white leading-none mt-1">
                          {new Date(res.fecha_reserva + "T00:00:00").getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white line-clamp-1">
                          {res.servicio?.nombre || "Servicio desconocido"}
                        </p>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">
                          {res.hora_inicio?.slice(0, 5)} — {res.estado}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">
                        {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(res.precio || 0)}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${res.estado_pago === 'pagado' ? 'text-green-400' : 'text-amber-400'}`}>
                        {res.estado_pago}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Datos, Etiquetas y Notas */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Editor de Etiquetas */}
          <ClienteTagsEditor 
            clienteId={cliente.id} 
            initialTags={cliente.etiquetas || []} 
          />

          {/* Notas de CRM */}
          <ClienteNotas 
            clienteId={cliente.id} 
            initialNotas={notas} 
          />

          {/* Formulario de Datos Básicos (Colapsable o secundario) */}
          <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Editar Datos Básicos</h3>
            </div>
            <div className="p-2">
               <EditarClienteForm cliente={cliente} />
            </div>
          </div>

          {/* Auditoría */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] text-muted space-y-1">
            <p className="font-bold uppercase tracking-widest text-white/20 mb-2">Registro de Auditoría</p>
            <p>ID: {cliente.id}</p>
            <p>Creado: {new Date(cliente.created_at).toLocaleString("es-ES")}</p>
            <p>Actualizado: {new Date(cliente.updated_at).toLocaleString("es-ES")}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
