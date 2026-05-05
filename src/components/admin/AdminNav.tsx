import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export default function AdminNav({ title }: { title: string }) {
  return (
    <div className="mb-8 flex items-end justify-between border-b border-card-border pb-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <nav className="mt-2 flex gap-6 text-sm text-muted overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          <Link href="/admin/dashboard" className="transition-colors hover:text-accent whitespace-nowrap py-1">
            Dashboard
          </Link>
          <Link href="/admin/servicios" className="transition-colors hover:text-accent whitespace-nowrap py-1">
            Servicios
          </Link>
          <Link href="/admin/galeria" className="transition-colors hover:text-accent whitespace-nowrap py-1">
            Galería
          </Link>
          <Link href="/admin/clientes" className="transition-colors hover:text-accent whitespace-nowrap py-1">
            Clientes
          </Link>
          <Link href="/admin/calendario" className="transition-colors hover:text-accent whitespace-nowrap py-1">
            Calendario
          </Link>
        </nav>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm font-medium text-red-400 transition-colors hover:text-red-300 hover:underline"
        >
          Cerrar Sesión
        </button>
      </form>
    </div>
  );
}
