import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import EditarImagenForm from "@/components/admin/EditarImagenForm";
import { Page } from "@/components/admin/ui";

export default async function EditarImagenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: imagen } = await supabase
    .from("imagen")
    .select("id, titulo, descripcion, url_imagen")
    .eq("id", id)
    .single();

  if (!imagen) {
    notFound();
  }

  return (
    <Page width="medium">
      <AdminNav title="Editar imagen" description={imagen.titulo} />
      <EditarImagenForm imagen={imagen} />
    </Page>
  );
}
