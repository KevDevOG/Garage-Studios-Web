"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { searchClientes } from "@/app/actions/clientes";
import { Field, buttonClass, cx } from "./ui";

interface ClienteResult {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
}

/**
 * Buscador de clientes con patrón combobox: flechas para moverse, Intro para
 * elegir y Escape para cerrar. Busca con espera de 300 ms tras escribir.
 */
export default function ClienteSearch({
  onSelect,
  initialQuery = "",
}: {
  onSelect: (cliente: ClienteResult | null) => void;
  /** Texto con el que arranca la búsqueda (p. ej. el nombre que llega por URL). */
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ClienteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState(false);
  const [selected, setSelected] = useState<ClienteResult | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const inputId = `${uid}-cliente`;
  const listId = `${uid}-lista`;
  const optionId = (index: number) => `${uid}-opcion-${index}`;

  useEffect(() => {
    let cancelled = false;
    const handler = setTimeout(async () => {
      if (query.trim().length >= 2) {
        try {
          const data = await searchClientes(query);
          if (cancelled) return;
          setResults(data);
          setSearchError(false);
          setActiveIndex(-1);
          setIsOpen(true);
        } catch {
          if (cancelled) return;
          setResults([]);
          setSearchError(true);
          setIsOpen(true);
        }
      } else {
        setResults([]);
        setSearchError(false);
        setIsOpen(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
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
    setActiveIndex(-1);
    onSelect(cliente);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(e.key === "ArrowDown" ? 0 : results.length - 1);
        return;
      }
      setActiveIndex((current) => {
        if (e.key === "ArrowDown") return current >= results.length - 1 ? 0 : current + 1;
        return current <= 0 ? results.length - 1 : current - 1;
      });
      return;
    }
    // Intro elige la opción resaltada; sin opción resaltada no envía el formulario por error.
    if (e.key === "Enter" && isOpen) {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) handleSelect(results[activeIndex]);
    }
  };

  const listVisible = isOpen && results.length > 0;
  const noResults = isOpen && results.length === 0 && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative">
      <Field
        label="Buscar cliente existente"
        htmlFor={inputId}
        hint={
          selected ? (
            <span className="inline-flex items-center gap-1 text-gs-ok">
              <Check aria-hidden className="size-3.5" />
              Cliente seleccionado: {selected.nombre}
            </span>
          ) : (
            "Opcional. Si no eliges ninguno, se crea o se reutiliza automáticamente."
          )
        }
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={listVisible}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-describedby={`${inputId}-ayuda`}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) {
                setSelected(null);
                onSelect(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nombre, correo o teléfono"
            className="w-full"
          />
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar el cliente seleccionado"
              className={buttonClass("secondary", "md", "w-11 px-0 sm:w-10")}
            >
              <X aria-hidden />
            </button>
          )}
        </div>
      </Field>

      <ul
        id={listId}
        role="listbox"
        aria-label="Clientes encontrados"
        hidden={!listVisible}
        className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gs-line-strong bg-gs-raised"
      >
        {listVisible &&
          results.map((c, index) => (
            <li
              key={c.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown evita que el input pierda el foco antes de elegir.
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(c);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cx(
                "flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 border-b border-gs-line px-3 py-2 last:border-0",
                index === activeIndex && "bg-gs-line",
              )}
            >
              <span className="text-[14px] font-medium text-gs-paper">{c.nombre}</span>
              <span className="text-[12px] text-gs-soft">
                {c.email || "Sin correo"}, {c.telefono || "sin teléfono"}
              </span>
            </li>
          ))}
      </ul>

      {(noResults || searchError) && (
        <div
          role="status"
          className="absolute z-30 mt-1 w-full rounded-lg border border-gs-line-strong bg-gs-raised px-3 py-2.5 text-[13px] text-gs-soft"
        >
          {searchError ? "No se pudo buscar. Inténtalo de nuevo." : "No se encontraron clientes."}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {listVisible ? `${results.length} ${results.length === 1 ? "cliente encontrado" : "clientes encontrados"}` : ""}
      </p>
    </div>
  );
}
