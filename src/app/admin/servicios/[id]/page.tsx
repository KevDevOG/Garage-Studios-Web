import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EditarServicioForm from "@/components/admin/EditarServicioForm";
import { Page } from "@/components/admin/ui";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: servicio } = await supabase
    .from("servicio")
    .select("id, nombre, descripcion, precio, duracion_minutos, categoria, subcategoria, icono, es_pack")
    .eq("id", id)
    .single();

  if (!servicio) {
    notFound();
  }

  return (
    <Page width="medium">
      <AdminNav title="Editar servicio" description={servicio.nombre} />
      <EditarServicioForm servicio={servicio} />
    </Page>
  );
}
