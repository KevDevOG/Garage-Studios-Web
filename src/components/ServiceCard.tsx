import Link from "next/link";

export interface ServiceDisplay {
  id: string;
  name: string;
  description: string;
  price: string;
  duration?: string;
  icon: string;
  iconUrl?: string | null;
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
    <div className={`group flex flex-col justify-between rounded-xl border bg-card-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(0,0,0,0.6)] ${featured ? "border-accent/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-accent/20 hover:border-accent" : "border-card-border hover:border-accent/40"}`}>
      {/* Icono y nombre */}
      <div>
        <div className={`mb-6 flex ${featured ? "h-24 w-24" : "h-20 w-20"} items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${featured ? "border-accent/30 bg-accent/10 text-accent shadow-[0_0_30px_rgba(245,158,11,0.2)]" : "border-white/5 bg-white/5 text-white/80 group-hover:border-accent/30 group-hover:bg-accent/5 group-hover:text-accent"}`}>
          {service.iconUrl ? (
            <img 
              src={service.iconUrl} 
              alt={service.name} 
              loading="lazy"
              className={`${featured ? "w-16 h-16" : "w-14 h-14"} object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
            />
          ) : (
            <span className={`${featured ? "text-5xl" : "text-4xl"} filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]`}>{service.icon}</span>
          )}
        </div>
        <h3 className="text-lg font-bold tracking-tight text-white">{service.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted font-medium">{service.description}</p>
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
