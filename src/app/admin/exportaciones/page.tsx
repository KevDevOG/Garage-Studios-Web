"use client";

import { useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Download, FileSpreadsheet, Users, Wallet, MessageSquare, Tag, Loader2 } from "lucide-react";
import { exportToExcel } from "@/app/actions/exportaciones";
import { toast } from "sonner";

const EXPORT_CARDS = [
  { id: "reservas", label: "Reservas", icon: FileSpreadsheet, color: "text-blue-400", desc: "Historial completo de citas, estados y cobros." },
  { id: "clientes", label: "Clientes", icon: Users, color: "text-purple-400", desc: "Base de datos de clientes, etiquetas y métricas comerciales." },
  { id: "finanzas", label: "Finanzas", icon: Wallet, color: "text-green-400", desc: "Movimientos de ingresos, gastos y categorías." },
  { id: "contactos", label: "Contactos", icon: MessageSquare, color: "text-amber-400", desc: "Mensajes recibidos desde el formulario web." },
  { id: "servicios", label: "Servicios", icon: Tag, color: "text-emerald-400", desc: "Catálogo de servicios, precios y configuraciones." },
];

export default function ExportacionesPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleExport = async (type: any) => {
    setLoadingId(type);
    try {
      const result = await exportToExcel(type);
      
      // Descargar el archivo
      const byteCharacters = atob(result.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exportación de ${type} generada con éxito`);
    } catch (error) {
      console.error(error);
      toast.error("Error al generar la exportación");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <AdminNav title="Copias de Seguridad" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_CARDS.map((card) => (
          <div 
            key={card.id}
            className="group relative bg-card-bg border border-white/5 rounded-2xl p-6 shadow-xl hover:border-accent/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${card.color} border border-white/5`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">{card.label}</h3>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  {card.desc}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExport(card.id)}
              disabled={loadingId !== null}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-accent hover:text-black border border-white/10 hover:border-accent rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {loadingId === card.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loadingId === card.id ? "Generando..." : "Descargar Excel"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-accent/5 border border-accent/20 rounded-2xl p-6">
        <h4 className="text-xs font-black text-accent uppercase tracking-widest mb-2">Aviso de Seguridad</h4>
        <p className="text-xs text-accent/80 leading-relaxed">
          Estas exportaciones contienen datos sensibles de clientes y del negocio. 
          Cada descarga queda registrada en el log de auditoría con tu usuario. 
          Asegúrate de almacenar estos archivos en un lugar seguro.
        </p>
      </div>
    </div>
  );
}
