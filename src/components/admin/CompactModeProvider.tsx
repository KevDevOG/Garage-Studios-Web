"use client";

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "admin-compact-mode";
const BODY_CLASS = "compact-mode";

// ── Almacén externo (localStorage + clase en <body>) ───────────
// useSyncExternalStore evita el setState dentro de useEffect y mantiene el
// servidor (siempre "normal") y el cliente coherentes durante la hidratación.
const listeners = new Set<() => void>();

function readCompact(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applyBodyClass(value: boolean) {
  document.body.classList.toggle(BODY_CLASS, value);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Sincroniza la clase del body con la preferencia guardada al suscribirse
  applyBodyClass(readCompact());
  return () => {
    listeners.delete(listener);
  };
}

function setCompact(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* almacenamiento no disponible */
  }
  applyBodyClass(value);
  listeners.forEach((listener) => listener());
}

interface CompactModeContextType {
  isCompact: boolean;
  toggleCompact: () => void;
}

const CompactModeContext = createContext<CompactModeContextType | undefined>(undefined);

export function CompactModeProvider({ children }: { children: React.ReactNode }) {
  const isCompact = useSyncExternalStore(subscribe, readCompact, () => false);

  const toggleCompact = useCallback(() => {
    setCompact(!readCompact());
  }, []);

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
