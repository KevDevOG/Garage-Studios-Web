import type { ChangeEvent, ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { Field, buttonClass, cx } from "@/components/admin/ui";

/** Alternador archivo / URL: dos botones con aria-pressed. */
export function ModeToggle({
  mode,
  onChange,
  fileLabel,
  urlLabel,
  label,
}: {
  mode: "file" | "url";
  onChange: (m: "file" | "url") => void;
  fileLabel: string;
  urlLabel: string;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="mb-3 inline-flex flex-wrap gap-2">
      {(
        [
          ["file", fileLabel],
          ["url", urlLabel],
        ] as const
      ).map(([value, text]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={buttonClass(mode === value ? "secondary" : "ghost", "sm", mode === value ? "border-gs-paper/40" : undefined)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Zona de selección de archivos: el input real es accesible por teclado (sr-only + foco visible en la etiqueta). */
export function FileZone({
  id,
  name,
  multiple,
  onChange,
  title,
  hint,
}: {
  id: string;
  name: string;
  multiple?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  hint: string;
}) {
  return (
    <div className="relative">
      <input
        type="file"
        id={id}
        name={name}
        multiple={multiple}
        accept="image/jpeg, image/png, image/webp"
        onChange={onChange}
        aria-describedby={`${id}-ayuda`}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gs-line-strong bg-gs-sunken px-4 py-6 text-center transition-colors hover:border-gs-soft peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gs-amber"
      >
        <UploadCloud aria-hidden className="size-6 text-gs-soft" />
        <span className="text-[14px] font-medium text-gs-paper">{title}</span>
        <span id={`${id}-ayuda`} className="text-[12px] leading-snug text-gs-faint">
          {hint}
        </span>
      </label>
    </div>
  );
}

export function TipoSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Field label="Tipo de contenido" htmlFor="tipo">
      <select id="tipo" name="tipo" defaultValue={defaultValue} className="w-full">
        <option value="fotos">Sesión de fotos</option>
        <option value="grabaciones">Sesión de grabación</option>
        <option value="rodajes">Rodaje</option>
      </select>
    </Field>
  );
}

/** Casillas de visibilidad y destacado (mismos name que antes: activo / destacado). */
export function PublicacionChecks({
  activoDefault,
  destacadoDefault,
}: {
  activoDefault?: boolean;
  destacadoDefault?: boolean;
}) {
  const row = "flex min-h-10 cursor-pointer select-none items-center gap-2.5 text-[14px] text-gs-paper";
  return (
    <fieldset className="flex flex-wrap gap-x-6 gap-y-1 border-t border-gs-line pt-4">
      <legend className="sr-only">Publicación</legend>
      <label htmlFor="activo" className={row}>
        <input type="checkbox" id="activo" name="activo" defaultChecked={activoDefault} />
        Visible en la web
      </label>
      <label htmlFor="destacado" className={row}>
        <input type="checkbox" id="destacado" name="destacado" defaultChecked={destacadoDefault} />
        Destacada
      </label>
    </fieldset>
  );
}

/** Vista previa en caja de tamaño fijo. Usa <img> porque la fuente puede ser blob: o URL arbitraria. */
export function VistaPrevia({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={cx(
        "relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-gs-line bg-gs-sunken",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- blob: local o URL externa introducida por el admin */}
      <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </div>
  );
}

export function Seccion({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}
