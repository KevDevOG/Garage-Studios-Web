import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditarServicioForm from "@/components/admin/EditarServicioForm";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: servicio } = await supabase
    .from("servicio")
    .select("*")
    .eq("id", id)
    .single();

  if (!servicio) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 border-b border-card-border pb-4">
        <Link
          href="/admin/servicios"
          className="text-sm font-medium text-muted hover:text-white"
        >
          &larr; Volver a Servicios
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Editar Servicio</h1>
      </div>

      <EditarServicioForm servicio={servicio} />
    </section>
  );
}
