"use client";

import { useRouter } from "next/navigation";

export default function DateJump({
  currentFecha,
  view = "weekly",
}: {
  currentFecha: string;
  view?: "weekly" | "daily";
}) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      // Al saltar a una fecha se conserva la vista (semanal/diaria).
      router.push(`/admin/calendario?view=${view}&fecha=${date}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="jump-date" className="text-xs font-medium text-muted uppercase tracking-wider">
        Ir a fecha:
      </label>
      {/* key: fuerza a remontar el input cuando cambia la fecha de la URL (flechas, vistas). */}
      <input
        key={currentFecha}
        id="jump-date"
        type="date"
        defaultValue={currentFecha}
        onChange={handleChange}
        className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
      />
    </div>
  );
}
