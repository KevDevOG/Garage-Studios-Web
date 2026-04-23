import Link from "next/link";

export interface ServiceDisplay {
  id: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  icon: string;
}

interface ServiceCardProps {
  service: ServiceDisplay;
  featured?: boolean;
}

export default function ServiceCard({ service, featured = false }: ServiceCardProps) {
  return (
    <div className={`group flex flex-col justify-between rounded-xl border bg-card-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(30,58,138,0.15)] ${featured ? "border-primary/50 shadow-[0_0_15px_rgba(30,58,138,0.1)] hover:border-primary" : "border-card-border hover:border-primary/50"}`}>
      {/* Icono y nombre */}
      <div>
        <span className="inline-block text-3xl transition-transform duration-300 group-hover:scale-110">{service.icon}</span>
        <h3 className="mt-3 text-lg font-semibold">{service.name}</h3>
        <p className="mt-2 text-sm text-muted">{service.description}</p>
      </div>

      {/* Precio, duración y botón */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-accent">{service.price}</span>
          {service.duration && <span className="text-muted">{service.duration}</span>}
        </div>
        <Link
          href={`/reservas?servicio=${service.id}`}
          className={`mt-4 block rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${featured ? "bg-primary text-white hover:bg-primary-hover hover:shadow-[0_0_15px_rgba(30,58,138,0.3)]" : "bg-accent text-black hover:bg-accent-hover hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]"}`}
        >
          Reservar
        </Link>
      </div>
    </div>
  );
}
