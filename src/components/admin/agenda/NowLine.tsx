"use client";

import { useSyncExternalStore } from "react";
import { nowMinutesInStudio } from "@/lib/dates";

// Reloj compartido: un único intervalo aunque haya varias líneas en pantalla.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 30_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => nowMinutesInStudio();

/**
 * Cabezal de reproducción: marca la hora actual del estudio (Canarias) sobre
 * una pista horizontal ("x") o una rejilla vertical ("y") y avanza solo.
 */
export default function NowLine({
  rangeStart,
  rangeEnd,
  initialMinutes,
  axis = "x",
}: {
  rangeStart: number;
  rangeEnd: number;
  /** Minutos calculados en el servidor, para que el primer pintado coincida. */
  initialMinutes: number;
  axis?: "x" | "y";
}) {
  const minutes = useSyncExternalStore(subscribe, getSnapshot, () => initialMinutes);
  if (minutes < rangeStart || minutes > rangeEnd) return null;

  const position = `${((minutes - rangeStart) / (rangeEnd - rangeStart)) * 100}%`;

  if (axis === "y") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-20 h-px bg-gs-amber"
        style={{ top: position }}
      >
        <span className="absolute -left-[3px] -top-[3px] block size-[7px] rounded-full bg-gs-amber" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-20 w-px bg-gs-amber"
      style={{ left: position }}
    >
      <span className="absolute -left-[3px] -top-px block size-[7px] rounded-full bg-gs-amber" />
    </span>
  );
}
