import Link from "next/link";
import type { ReactNode } from "react";

/* ── Piezas base del panel ─────────────────────────────────────
   Sin estado y sin "use client": sirven igual en Server y Client Components.
   Reglas de la consola del estudio:
   · Texto en minúscula con mayúscula inicial; nada de etiquetas en versalitas.
   · Tamaños: 12 (metadatos) · 13 (tablas, secundarios) · 14 (cuerpo) · 16+ (títulos).
   · El ámbar es señal: acción principal, hoy/ahora y lo que espera respuesta.
   · Bordes de 1px (gs-line); sin sombras ni degradados decorativos. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Página ── */

const PAGE_WIDTH = {
  wide: "max-w-[1360px]",
  medium: "max-w-[960px]",
  narrow: "max-w-[720px]",
} as const;

/** Contenedor de toda página del panel: alineado a la izquierda, mismo margen. */
export function Page({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof PAGE_WIDTH;
  className?: string;
}) {
  return (
    <section className={cx("w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-7", PAGE_WIDTH[width], className)}>
      {children}
    </section>
  );
}

/* ── Botones ── */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const BUTTON_SIZE: Record<ButtonSize, string> = {
  md: "h-11 px-4 text-[14px] sm:h-10 sm:px-3.5",
  sm: "h-10 px-3 text-[13px] sm:h-8 sm:px-2.5",
};

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-gs-amber font-semibold text-[#17120a] hover:bg-[#ffb52e]",
  secondary:
    "border border-gs-line-strong bg-gs-raised text-gs-paper hover:border-[#484b51] hover:bg-[#212328]",
  ghost: "text-gs-soft hover:bg-white/[0.05] hover:text-gs-paper",
  danger: "border border-[#4d2623] bg-[#221413] text-[#f19086] hover:border-[#6b332f] hover:bg-[#2d1917]",
};

/** Clases de botón, para aplicar a <button>, <Link> o <a>. */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return cx(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_VARIANT[variant], extra);
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/* ── Panel ── */

/** Superficie con cabecera opcional. `flush` quita el relleno (tablas, listas). */
export function Panel({
  title,
  meta,
  action,
  children,
  flush = false,
  className,
  headingLevel = 2,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className={cx("min-w-0 rounded-lg border border-gs-line bg-gs-surface", className)}>
      {(title || action) && (
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gs-line px-4 py-2">
          <Heading className="flex min-w-0 items-baseline gap-2 text-[14px] font-semibold text-gs-paper">
            <span className="truncate">{title}</span>
            {meta !== undefined && meta !== null && (
              <span className="shrink-0 text-[13px] font-normal text-gs-faint">{meta}</span>
            )}
          </Heading>
          {action}
        </header>
      )}
      <div className={flush ? undefined : "p-4"}>{children}</div>
    </section>
  );
}

/* ── Etiquetas de estado ── */

export type Tone = "amber" | "ok" | "info" | "bad" | "neutral";

export const TONE_TEXT: Record<Tone, string> = {
  amber: "text-gs-amber",
  ok: "text-gs-ok",
  info: "text-gs-info",
  bad: "text-gs-bad",
  neutral: "text-gs-soft",
};

export const TONE_BG: Record<Tone, string> = {
  amber: "bg-gs-amber",
  ok: "bg-gs-ok",
  info: "bg-gs-info",
  bad: "bg-gs-bad",
  neutral: "bg-[#6f7277]",
};

/** Estado como punto de color + texto. El color nunca es la única pista. */
export function Badge({
  tone = "neutral",
  children,
  className,
  plain = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  /** Sin cápsula: solo punto y texto (para filas densas). */
  plain?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium leading-none",
        !plain && "rounded-full border border-gs-line bg-gs-raised px-2 py-[5px]",
        TONE_TEXT[tone],
        className,
      )}
    >
      <span aria-hidden className={cx("size-1.5 shrink-0 rounded-full", TONE_BG[tone])} />
      {children}
    </span>
  );
}

/* ── Control segmentado (enlaces) ── */

export type SegmentItem = { href: string; label: string; active: boolean };

/** Cambia de vista o de periodo navegando: cada opción es un enlace real. */
export function Segmented({ items, label }: { items: SegmentItem[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-md border border-gs-line bg-gs-surface p-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cx(
            "inline-flex h-10 items-center rounded-[5px] px-3 text-[13px] font-medium leading-none sm:h-8",
            item.active
              ? "bg-gs-raised text-gs-paper shadow-[inset_0_0_0_1px_#33363b]"
              : "text-gs-soft hover:text-gs-paper",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/* ── Estado vacío y avisos ── */

/** Vacío: dice qué pasa y, si procede, ofrece el siguiente paso. */
export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("px-4 py-6", className)}>
      <p className="text-[14px] font-medium text-gs-paper">{title}</p>
      {hint && <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-gs-soft">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "bad",
  title,
  children,
  className,
}: {
  tone?: "bad" | "amber" | "neutral";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const border =
    tone === "bad" ? "border-[#4d2623] bg-[#1d1211]" : tone === "amber" ? "border-[#4a3610] bg-[#1b1509]" : "border-gs-line bg-gs-surface";
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cx("rounded-lg border px-4 py-3", border, className)}>
      {title && <p className={cx("text-[14px] font-semibold", TONE_TEXT[tone])}>{title}</p>}
      {children && <div className={cx("text-[13px] leading-relaxed text-gs-soft", title && "mt-1")}>{children}</div>}
    </div>
  );
}

/* ── Cifras ── */

/** Fila de cifras separadas por líneas, en lugar de una tarjeta por cifra. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cx(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-gs-line bg-gs-surface sm:flex sm:flex-wrap",
        "[&>*]:border-gs-line max-sm:[&>*:nth-child(even)]:border-l max-sm:[&>*:nth-child(n+3)]:border-t sm:[&>*]:flex-1 sm:[&>*+*]:border-l",
        // Con un número impar de cifras, la última ocupa la fila entera en móvil.
        "max-sm:[&>*:last-child:nth-child(odd)]:col-span-2",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0 px-4 py-3 sm:min-w-[9rem]">
      <dt className="truncate text-[12px] text-gs-soft">{label}</dt>
      <dd
        className={cx(
          "gs-display mt-1.5 truncate text-[22px] font-semibold leading-none",
          tone ? TONE_TEXT[tone] : "text-gs-paper",
        )}
      >
        {value}
      </dd>
      {hint && <p className="mt-1.5 truncate text-[12px] text-gs-faint">{hint}</p>}
    </div>
  );
}

/* ── Formularios ── */

/** Etiqueta + control + ayuda/error. El control se pasa como hijo. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-gs-paper">
        {label}
        {required && (
          <span aria-hidden className="text-gs-amber">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-ayuda`} className="mt-1.5 text-[12px] leading-snug text-gs-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-[12px] leading-snug text-gs-bad">
          {error}
        </p>
      )}
    </div>
  );
}

/** Barra de acciones al pie de un formulario. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-2 border-t border-gs-line pt-4", className)}>
      {children}
    </div>
  );
}

/* ── Tablas ── */

/** Clases para tablas densas. Envolver siempre en `table.wrap` (scroll horizontal). */
export const table = {
  wrap: "overflow-x-auto rounded-lg border border-gs-line bg-gs-surface",
  table: "w-full border-collapse text-left text-[13px]",
  th: "whitespace-nowrap border-b border-gs-line px-3 py-2.5 text-[12px] font-medium text-gs-faint first:pl-4 last:pr-4",
  tr: "border-b border-gs-line last:border-0 hover:bg-white/[0.025]",
  td: "px-3 py-2.5 align-middle text-gs-paper first:pl-4 last:pr-4",
  num: "text-right tabular-nums",
} as const;

/** Enlace de texto dentro de tablas y párrafos. */
export const textLink = "text-gs-paper underline decoration-gs-line-strong underline-offset-4 hover:decoration-gs-amber";
