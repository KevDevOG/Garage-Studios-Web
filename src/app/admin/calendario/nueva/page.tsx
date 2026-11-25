import AdminNav from "@/components/admin/AdminNav";
import NuevaReservaForm from "@/components/admin/NuevaReservaForm";
import { Page } from "@/components/admin/ui";
import { getActiveServices } from "@/app/actions/services";
import { isValidIsoDate, todayInStudio } from "@/lib/dates";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Primer valor de un parámetro de URL (puede venir repetido). */
function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function NuevaReservaPage({ searchParams }: { searchParams: SearchParams }) {
  const [servicesList, params] = await Promise.all([getActiveServices(), searchParams]);

  // ?fecha=YYYY-MM-DD precarga el día; si falta o no es válida, hoy en el estudio.
  const fechaParam = firstParam(params.fecha);
  const initialFecha = isValidIsoDate(fechaParam) ? fechaParam : todayInStudio();

  // ?cliente=Nombre (lo envía la ficha del cliente) precarga el nombre y la búsqueda.
  const initialCliente = firstParam(params.cliente).trim().slice(0, 120);

  return (
    <Page width="medium">
      <AdminNav
        title="Nueva reserva"
        description="Se crea como pendiente. Confírmala después para avisar al cliente por correo."
      />
      <NuevaReservaForm
        servicesList={servicesList}
        initialFecha={initialFecha}
        initialCliente={initialCliente}
      />
    </Page>
  );
}
