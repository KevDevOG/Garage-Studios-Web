"use client";

import { useState } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Page, Panel, Notice, buttonClass } from "@/components/admin/ui";
import { Download, Loader2 } from "lucide-react";
import { exportToExcel, type ExportType } from "@/app/actions/exportaciones";
import { toast } from "sonner";

const EXPORTS: { id: ExportType; label: string; desc: string }[] = [
  { id: "reservas", label: "Reservas", desc: "Historial completo de citas, estados y cobros." },
  { id: "clientes", label: "Clientes", desc: "Base de clientes, etiquetas y métricas comerciales." },
  { id: "finanzas", label: "Finanzas", desc: "Movimientos de ingresos, gastos y categorías." },
  { id: "contactos", label: "Contactos", desc: "Mensajes recibidos desde el formulario web." },
  { id: "servicios", label: "Servicios", desc: "Catálogo de servicios, precios y configuraciones." },
];

export default function ExportacionesPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleExport = async (type: ExportType) => {
    setLoadingId(type);
    try {
      const result = await exportToExcel(type);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.error("La exportación no devolvió ningún archivo");
        return;
      }

      // Descargar el archivo
      const byteCharacters = atob(result.data.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
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
    <Page width="medium">
      <AdminNav
        title="Copias de seguridad"
        description="Descarga tus datos en hojas de Excel para conservar una copia fuera del panel."
      />

      <div className="space-y-4">
        <Panel flush>
          <ul className="divide-y divide-gs-line">
            {EXPORTS.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-[14px] font-medium text-gs-paper">{item.label}</p>
                  <p className="text-[13px] text-gs-soft">{item.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-gs-faint">Excel (.xlsx)</span>
                  <button
                    type="button"
                    onClick={() => handleExport(item.id)}
                    disabled={loadingId !== null}
                    aria-label={`Descargar ${item.label.toLowerCase()}`}
                    className={buttonClass("secondary", "sm")}
                  >
                    {loadingId === item.id ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Download aria-hidden="true" />
                    )}
                    {loadingId === item.id ? "Generando…" : "Descargar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Notice tone="amber" title="Contienen datos personales">
          Estos archivos incluyen datos personales de clientes y del negocio. Cada descarga queda registrada en la
          auditoría con tu usuario. Guárdalos en un lugar seguro y no los compartas.
        </Notice>
      </div>
    </Page>
  );
}
