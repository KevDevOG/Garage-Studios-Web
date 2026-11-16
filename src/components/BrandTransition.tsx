"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Transición de marca al entrar en Garage Visuals (fondo claro): un flash
 * blanco muy breve y un fade del contenido. Con movimiento reducido no hay
 * flash ni escala.
 */
export default function BrandTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isVisuals = pathname === "/visuals" && !reduceMotion;

  return (
    <div className="relative">
      {isVisuals && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[9999] bg-[#FAFAFA]"
          aria-hidden="true"
        />
      )}

      <motion.div
        initial={isVisuals ? { opacity: 0.5, scale: 0.98 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: isVisuals ? 0.15 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
