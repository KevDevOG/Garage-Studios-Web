import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export default function AdminNav({ title }: { title: string }) {
  return (
    <div className="mb-8 flex items-end justify-between border-b border-card-border pb-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <nav className="mt-2 flex gap-4 text-sm text-muted">
          <Link href="/admin/dashboard" className="transition-colors hover:text-accent">
            Dashboard
          </Link>
          <Link href="/admin/servicios" className="transition-colors hover:text-accent">
            Servicios
          </Link>
          <Link href="/admin/galeria" className="transition-colors hover:text-accent">
            Galería
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
