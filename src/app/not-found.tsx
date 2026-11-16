import type { Metadata } from "next";
import Link from "next/link";
import { Disc3, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada | Garage Studios",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
      <Disc3 className="mb-6 h-16 w-16 text-accent motion-safe:animate-[spin_6s_linear_infinite]" aria-hidden="true" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-accent">Error 404</p>
      <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">
        Esta pista no <span className="text-accent">existe</span>
      </h1>
      <p className="mt-6 max-w-md text-lg font-medium text-muted">
        La página que buscas se ha movido o nunca estuvo aquí. Vuelve al inicio o reserva tu
        próxima sesión en el estudio.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-accent-hover hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] motion-safe:hover:scale-105"
        >
          Volver al inicio <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/reservas"
          className="rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:border-white/40 hover:bg-white/10"
        >
          Reservar sesión
        </Link>
      </div>
    </section>
  );
}
