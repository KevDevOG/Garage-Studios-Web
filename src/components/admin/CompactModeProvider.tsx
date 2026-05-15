"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface CompactModeContextType {
  isCompact: boolean;
  toggleCompact: () => void;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

export function CompactModeProvider({ children }: { children: React.ReactNode }) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    // Cargar preferencia inicial
    const saved = localStorage.getItem("admin-compact-mode");
    if (saved === "true") {
      setIsCompact(true);
      document.body.classList.add("compact-mode");
    }
  }, []);

  const toggleCompact = () => {
    const newVal = !isCompact;
    setIsCompact(newVal);
    localStorage.setItem("admin-compact-mode", String(newVal));
    
    if (newVal) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  };

  return (
    <CompactModeContext.Provider value={{ isCompact, toggleCompact }}>
      {children}
    </CompactModeContext.Provider>
  );
}

export function useCompactMode() {
  const context = useContext(CompactModeContext);
  if (context === undefined) {
    throw new Error("useCompactMode must be used within a CompactModeProvider");
  }
  return context;
}
