import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import EditarImagenForm from "@/components/admin/EditarImagenForm";

export default async function EditarImagenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: imagen } = await supabase
    .from("imagen")
    .select("*")
    .eq("id", id)
    .single();

  if (!imagen) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-8 border-b border-card-border pb-4">
        <Link
          href="/admin/galeria"
          className="text-sm font-medium text-muted hover:text-white"
        >
          &larr; Volver a Galería
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Editar Imagen</h1>
      </div>

      <EditarImagenForm imagen={imagen} />
    </section>
  );
}
