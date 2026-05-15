import { getFinanceMovements, getFinanceSummary } from "@/app/actions/finanzas";
import { Printer } from "lucide-react";

export default async function InformeFinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : new Date().getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();

  const movements = await getFinanceMovements(month, year);
  const summary = await getFinanceSummary(month, year);

  const monthName = new Date(year, month - 1).toLocaleString("es-ES", { month: "long" });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(val);

  return (
    <div className="bg-white min-h-screen p-8 text-black font-sans print:p-0">
      {/* Header Informe */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Informe Financiero</h1>
          <p className="text-xl font-bold text-gray-600 capitalize">{monthName} {year}</p>
          <p className="text-sm font-medium mt-1">Garage Studios - Control Administrativo</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Fecha de generación:</p>
          <p className="text-sm">{new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </div>

      {/* KPIs Summary Section */}
      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="border border-black p-4">
          <p className="text-xs font-black uppercase tracking-widest mb-1">Total Ingresos</p>
          <p className="text-2xl font-black">{formatCurrency(summary.ingresos)}</p>
        </div>
        <div className="border border-black p-4">
          <p className="text-xs font-black uppercase tracking-widest mb-1">Total Gastos</p>
          <p className="text-2xl font-black">{formatCurrency(summary.gastos)}</p>
        </div>
        <div className="bg-gray-100 border border-black p-4">
          <p className="text-xs font-black uppercase tracking-widest mb-1">Beneficio Neto</p>
          <p className="text-2xl font-black">{formatCurrency(summary.beneficio)}</p>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="mb-10">
        <h2 className="text-sm font-black uppercase tracking-widest border-b border-black pb-2 mb-4">Detalle de Movimientos</h2>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-black font-black uppercase text-[10px]">
              <th className="py-2 px-2">Fecha</th>
              <th className="py-2 px-2">Concepto</th>
              <th className="py-2 px-2">Categoría</th>
              <th className="py-2 px-2">Método</th>
              <th className="py-2 px-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((mov) => (
              <tr key={mov.id} className="border-b border-gray-200">
                <td className="py-3 px-2">{new Date(mov.fecha).toLocaleDateString("es-ES")}</td>
                <td className="py-3 px-2 font-bold">{mov.concepto}</td>
                <td className="py-3 px-2 text-xs uppercase">{mov.categoria}</td>
                <td className="py-3 px-2 text-xs capitalize">{mov.metodo_pago}</td>
                <td className={`py-3 px-2 text-right font-black ${mov.tipo === 'ingreso' ? 'text-black' : 'text-gray-500 italic'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.importe)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Firmas */}
      <div className="mt-20 grid grid-cols-2 gap-20">
        <div className="border-t border-black pt-4">
          <p className="text-xs font-bold uppercase">Revisado por Admin</p>
          <div className="h-16"></div>
          <p className="text-[10px] text-gray-400 italic">Firma y Sello</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold uppercase">Garage Studios S.L.</p>
          <p className="text-[10px]">Las Palmas de Gran Canaria</p>
          <p className="text-[10px]">www.garagestudios.es</p>
        </div>
      </div>

      {/* Botón Flotante para imprimir (solo visible en pantalla) */}
      <button 
        onClick={() => typeof window !== 'undefined' && window.print()}
        className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 print:hidden"
      >
        <Printer className="w-4 h-4" />
        Imprimir Informe
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
