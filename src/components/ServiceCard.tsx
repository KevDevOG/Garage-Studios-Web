import Link from "next/link";

export interface ServiceDisplay {
  id: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  icon: string;
  category?: string;
  subcategory?: string | null;
  isPack?: boolean;
}

interface ServiceCardProps {
  service: ServiceDisplay;
  featured?: boolean;
}

export default function ServiceCard({ service, featured = false }: ServiceCardProps) {
  return (
    <div className={`group flex flex-col justify-between rounded-xl border bg-card-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${featured ? "border-accent/50 shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:border-accent" : "border-card-border hover:border-accent/40"}`}>
      {/* Icono y nombre */}
      <div>
        <span className="inline-block text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{service.icon}</span>
        <h3 className="mt-3 text-lg font-bold tracking-tight">{service.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
      </div>

      {/* Precio, duración y botón */}
      <div className="mt-6 pt-4 border-t border-card-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-lg font-black text-accent">{service.price}</span>
          {service.duration && <span className="text-xs uppercase tracking-widest text-muted">{service.duration}</span>}
        </div>
        <Link
          href={`/reservas?servicio=${service.id}`}
          className="mt-4 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-bold text-black transition-all hover:bg-accent-hover hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          RESERVAR
        </Link>
      </div>
    </div>
  );
}
