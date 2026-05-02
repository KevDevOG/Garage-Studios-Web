"use client";

import { useState, useEffect, useRef } from "react";
import { searchClientes } from "@/app/actions/clientes";

interface ClienteResult {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}

export default function ClienteSearch({
  onSelect,
}: {
  onSelect: (cliente: ClienteResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<ClienteResult | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const data = await searchClientes(query);
        setResults(data);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cliente: ClienteResult) => {
    setSelected(cliente);
    setQuery(cliente.nombre);
    setIsOpen(false);
    onSelect(cliente);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    onSelect(null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-sm font-medium">
        Buscar Cliente Existente
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) {
              setSelected(null);
              onSelect(null);
            }
          }}
          placeholder="Nombre, email o teléfono..."
          className="w-full text-sm"
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg bg-red-500/10 px-3 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20"
          >
            ✕
          </button>
        )}
      </div>

      {selected && (
        <p className="mt-1 text-[10px] text-green-400 font-bold uppercase tracking-widest">
          ✓ Cliente seleccionado: {selected.nombre}
        </p>
      )}

      {!selected && (
        <p className="mt-1 text-[10px] text-muted italic">
          Si no seleccionas, se creará o reutilizará automáticamente.
        </p>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-card-border bg-background shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="flex w-full flex-col gap-0.5 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-accent/10 last:border-0"
            >
              <span className="text-sm font-bold text-white">{c.nombre}</span>
              <span className="text-[11px] text-muted">
                {c.email || "Sin email"} · {c.telefono || "Sin teléfono"}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-xs text-muted italic">
          No se encontraron clientes.
        </div>
      )}
    </div>
  );
}
