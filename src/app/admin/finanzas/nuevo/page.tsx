import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import FinanceForm, { type FinancePreset } from "@/components/admin/FinanceForm";
import { Page, Panel } from "@/components/admin/ui";
import { getActiveServices } from "@/app/actions/services";
import { isValidIsoDate } from "@/lib/dates";

export const metadata = {
  title: "Nuevo movimiento - Finanzas",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RawParams = { [key: string]: string | string[] | undefined };

/** Lista blanca de valores iniciales aceptados desde la URL (nunca activa modo edición). */
function buildPreset(params: RawParams): FinancePreset {
  const get = (key: string): string => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };

  const preset: FinancePreset = {};

  const tipo = get("tipo");
  if (tipo === "ingreso" || tipo === "gasto") preset.tipo = tipo;

  const categoria = get("categoria");
  if (categoria && categoria.length <= 60) preset.categoria = categoria;

  const concepto = get("concepto");
  if (concepto && concepto.length <= 120) preset.concepto = concepto;

  const importe = Number(get("importe").replace(",", "."));
  if (get("importe") && Number.isFinite(importe) && importe > 0) preset.importe = importe;

  const fecha = get("fecha");
  if (isValidIsoDate(fecha)) preset.fecha = fecha;

  const reservaId = get("reserva_id");
  if (UUID_RE.test(reservaId)) preset.reserva_id = reservaId;

  const clienteId = get("cliente_id");
  if (UUID_RE.test(clienteId)) preset.cliente_id = clienteId;

  return preset;
}

export default async function NuevaFinanzaPage(props: { searchParams: Promise<RawParams> }) {
  // Sesión + lista de administradores, validada una vez por petición.
  const { user } = await getAdminSession();

  if (!user) redirect("/admin/login");

  const searchParams = await props.searchParams;
  const services = await getActiveServices();

  return (
    <Page width="narrow">
      <AdminNav title="Nuevo movimiento" description="Registra un gasto o un ingreso que no venga de una reserva." />
      <Panel>
        <FinanceForm preset={buildPreset(searchParams)} services={services} />
      </Panel>
    </Page>
  );
}
