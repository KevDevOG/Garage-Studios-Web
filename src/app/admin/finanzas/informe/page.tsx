import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getFinanceMovements } from "@/app/actions/finanzas";
import { formatIsoDateEs, monthRange, parsePeriod, todayInStudio } from "@/lib/dates";
import { formatEUR } from "@/lib/format";
import PrintButton from "./PrintButton";

export const metadata = {
  title: "Informe financiero - Admin",
};

export default async function InformeFinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Sesión + lista de administradores, validada una vez por petición.
  const { user } = await getAdminSession();
  if (!user) redirect("/admin/login");

  const params = await searchParams;
  const { month, year } = parsePeriod(params.month, params.year);

  // Una sola lectura: los totales se derivan del propio listado (mismas reglas
  // que el resumen: sin ingresos manuales ligados a reserva, con cobros de reservas).
  const movements = await getFinanceMovements(month, year);
  const ingresos = movements.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.importe, 0);
  const gastos = movements.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.importe, 0);
  const summary = { ingresos, gastos, beneficio: ingresos - gastos };

  const monthName = formatIsoDateEs(monthRange(year, month).start, { month: "long" });
  const generatedOn = formatIsoDateEs(todayInStudio(), { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-black sm:p-10 print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* Cabecera del informe */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-5">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Informe financiero</h1>
            <p className="mt-1 text-[18px] font-medium text-neutral-700 first-letter:uppercase">
              {monthName} {year}
            </p>
            <p className="mt-1 text-[14px]">Garage Studios · Control administrativo</p>
          </div>
          <div className="text-right text-[14px]">
            <p className="font-semibold">Fecha de generación</p>
            <p>{generatedOn}</p>
          </div>
        </header>

        {/* Resumen */}
        <dl className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 print:grid-cols-3">
          <div className="border border-black p-4">
            <dt className="text-[13px] font-medium">Total ingresos</dt>
            <dd className="mt-1 text-[22px] font-semibold tabular-nums">{formatEUR(summary.ingresos)}</dd>
          </div>
          <div className="border border-black p-4">
            <dt className="text-[13px] font-medium">Total gastos</dt>
            <dd className="mt-1 text-[22px] font-semibold tabular-nums">{formatEUR(summary.gastos)}</dd>
          </div>
          <div className="border border-black bg-neutral-100 p-4">
            <dt className="text-[13px] font-medium">Beneficio neto</dt>
            <dd className="mt-1 text-[22px] font-semibold tabular-nums">{formatEUR(summary.beneficio)}</dd>
          </div>
        </dl>

        {/* Detalle de movimientos */}
        <section className="mb-10">
          <h2 className="mb-3 border-b border-black pb-2 text-[16px] font-semibold">Detalle de movimientos</h2>
          {movements.length === 0 ? (
            <p className="py-4 text-[14px] text-neutral-700">No hay movimientos en este periodo.</p>
          ) : (
            // En pantallas estrechas la tabla se desplaza dentro de su caja; al imprimir va entera.
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-black text-[12px] font-semibold">
                  <th scope="col" className="px-2 py-2">Fecha</th>
                  <th scope="col" className="px-2 py-2">Concepto</th>
                  <th scope="col" className="px-2 py-2">Categoría</th>
                  <th scope="col" className="px-2 py-2">Método</th>
                  <th scope="col" className="px-2 py-2">Tipo</th>
                  <th scope="col" className="px-2 py-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => (
                  <tr key={mov.id} className="break-inside-avoid border-b border-neutral-300">
                    <td className="whitespace-nowrap px-2 py-2.5 tabular-nums">
                      {formatIsoDateEs(mov.fecha, { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-2 py-2.5 font-medium">{mov.concepto}</td>
                    <td className="px-2 py-2.5">{mov.categoria}</td>
                    <td className="px-2 py-2.5 first-letter:uppercase">{mov.metodo_pago}</td>
                    <td className="px-2 py-2.5">{mov.tipo === "ingreso" ? "Ingreso" : "Gasto"}</td>
                    <td
                      className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${
                        mov.tipo === "ingreso" ? "text-black" : "text-neutral-600"
                      }`}
                    >
                      {mov.tipo === "ingreso" ? "+" : "-"}
                      {formatEUR(mov.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        {/* Pie y firma */}
        <footer className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 print:grid-cols-2">
          <div className="border-t border-black pt-3">
            <p className="text-[13px] font-semibold">Revisado por administración</p>
            <div className="h-16" />
            <p className="text-[12px] text-neutral-600">Firma y sello</p>
          </div>
          <div className="space-y-0.5 text-[12px] sm:text-right">
            <p className="font-semibold">Garage Studios S.L.</p>
            <p>Las Palmas de Gran Canaria</p>
            <p>www.garagestudios.es</p>
          </div>
        </footer>
      </div>

      {/* Botón flotante para imprimir (solo visible en pantalla) */}
      <PrintButton />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
