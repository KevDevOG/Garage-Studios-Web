"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import BlockTimeModal from "./BlockTimeModal";
import { buttonClass } from "./ui";

/** Abre el diálogo para bloquear una franja de la agenda. */
export default function BlockTimeButton({ initialDate }: { initialDate?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setShowModal(true)} className={buttonClass("secondary")}>
        <Lock aria-hidden /> Bloquear horas
      </button>

      {showModal && <BlockTimeModal initialDate={initialDate} onClose={() => setShowModal(false)} />}
    </>
  );
}
