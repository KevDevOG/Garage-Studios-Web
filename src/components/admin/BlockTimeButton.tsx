"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import BlockTimeModal from "./BlockTimeModal";

export default function BlockTimeButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-5 py-2.5 text-center text-sm font-bold text-red-400 transition-all hover:bg-red-500/10"
      >
        <ShieldAlert className="w-5 h-5" /> Bloquear Horas
      </button>

      {showModal && <BlockTimeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
