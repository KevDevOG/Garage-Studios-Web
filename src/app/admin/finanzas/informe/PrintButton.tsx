"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="fixed bottom-6 right-6 inline-flex h-11 items-center gap-2 rounded-md bg-black px-4 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black print:hidden"
    >
      <Printer className="size-4" aria-hidden="true" />
      Imprimir informe
    </button>
  );
}
