"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function BrandTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isVisuals = pathname === "/visuals";

  // Flash effect on mount
  return (
    <div className="relative">
      {isVisuals && (
        <motion.div
          initial={{ opacity: 1, backgroundColor: "#ffffff", filter: "brightness(2)" }}
          animate={{ opacity: 0, backgroundColor: "#FAFAFA", filter: "brightness(1)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[9999]"
        />
      )}
      
      {/* Fade in the content */}
      <motion.div
        initial={isVisuals ? { opacity: 0.5, scale: 0.98 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: isVisuals ? 0.2 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
