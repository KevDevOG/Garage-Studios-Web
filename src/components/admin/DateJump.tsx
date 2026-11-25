"use client";

import { useRouter } from "next/navigation";
import type { AgendaView } from "@/lib/agenda";

/** Salta a una fecha concreta conservando la vista (mes, semana o día). */
export default function DateJump({
  currentFecha,
  view = "semana",
}: {
  currentFecha: string;
  view?: AgendaView;
}) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) router.push(`/admin/calendario?view=${view}&fecha=${date}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="jump-date" className="whitespace-nowrap text-[13px] text-gs-soft max-sm:sr-only">
        Ir a<span className="sm:hidden"> una fecha</span>
      </label>
      {/* key: remonta el input cuando cambia la fecha de la URL (flechas, vistas). */}
      <input
        key={currentFecha}
        id="jump-date"
        type="date"
        defaultValue={currentFecha}
        onChange={handleChange}
        className="!min-h-10 !w-auto !py-1.5 sm:!min-h-8"
      />
    </div>
  );
}
