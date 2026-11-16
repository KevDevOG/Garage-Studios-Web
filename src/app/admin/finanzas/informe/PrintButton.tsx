"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 print:hidden"
    >
      <Printer className="w-4 h-4" aria-hidden="true" />
      Imprimir Informe
    </button>
  );
}
