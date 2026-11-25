"use client";

import { useRouter } from "next/navigation";

/** Selector de año de la vista anual: navega conservando el mes actual. */
export default function YearJump({
  year,
  month,
  years,
}: {
  year: number;
  month: number;
  years: number[];
}) {
  const router = useRouter();

  return (
    <div>
      <label htmlFor="finanzas-year" className="sr-only">
        Año
      </label>
      <select
        id="finanzas-year"
        value={year}
        onChange={(e) => router.push(`/admin/finanzas?view=anual&month=${month}&year=${Number(e.target.value)}`)}
        className="h-10 min-w-[5.5rem] cursor-pointer border text-[14px] font-medium sm:h-9"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
