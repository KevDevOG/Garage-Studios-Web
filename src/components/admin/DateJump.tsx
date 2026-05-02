"use client";

import { useRouter } from "next/navigation";

export default function DateJump({ currentFecha }: { currentFecha: string }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      // Al saltar a una fecha, reseteamos la semana a 0
      router.push(`/admin/calendario?fecha=${date}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="jump-date" className="text-xs font-medium text-muted uppercase tracking-wider">
        Ir a fecha:
      </label>
      <input
        id="jump-date"
        type="date"
        defaultValue={currentFecha}
        onChange={handleChange}
        className="rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
      />
    </div>
  );
}
