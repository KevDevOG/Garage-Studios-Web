"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarDays,
  Clapperboard,
  DatabaseBackup,
  Gauge,
  Globe,
  Images,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ScrollText,
  SlidersHorizontal,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CompactModeProvider, useCompactMode } from "./CompactModeProvider";

/* ── Paleta del marco ──────────────────────────────────────────
   Lienzo      #050505  fondo de la web (lo pinta el <body>)
   Grafito     #111214  superficie de la barra lateral y la barra móvil
   Línea       #222326  bordes y divisores, siempre de 1px
   Papel       #edebe4  texto principal (blanco cálido, como la cinta de consola)
   Anodizado   #a3a6ab  texto secundario · #8b8e94 etiquetas de grupo (≥ 5:1)
   Ámbar señal #f59e0b  solo para el piloto de la sección activa y el foco
   ──────────────────────────────────────────────────────────── */

export type AdminSection = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SectionGroup = { id: string; label: string; items: AdminSection[] };

// Agrupadas por el trabajo que resuelven, no por cómo está construido el sistema.
const SECTION_GROUPS: SectionGroup[] = [
  {
    id: "estudio",
    label: "Estudio",
    items: [
      { href: "/admin/dashboard", label: "Panel", icon: Gauge },
      { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    id: "web",
    label: "Contenido de la web",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: SlidersHorizontal },
      { href: "/admin/galeria", label: "Galería", icon: Images },
      { href: "/admin/visuals", label: "Visuals", icon: Clapperboard },
    ],
  },
  {
    id: "gestion",
    label: "Gestión",
    items: [
      { href: "/admin/finanzas", label: "Finanzas", icon: Receipt },
      { href: "/admin/exportaciones", label: "Copias de seguridad", icon: DatabaseBackup },
      { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
    ],
  },
];

export const ADMIN_SECTIONS: AdminSection[] = SECTION_GROUPS.flatMap((g) => g.items);

export function isSectionActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findSection(pathname: string | null): AdminSection | undefined {
  return ADMIN_SECTIONS.find((s) => isSectionActive(pathname, s.href));
}

/** Rutas de /admin que se muestran sin el marco del panel. */
function isBareRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    isSectionActive(pathname, "/admin/login") ||
    isSectionActive(pathname, "/admin/finanzas/informe")
  );
}

const ADMIN_FONT = "font-[family-name:var(--font-admin)]";
const DESKTOP_QUERY = "(min-width: 1024px)";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login e informe imprimible: sin marco, pero con su propio <main> para que
  // el enlace "Saltar al contenido" siga teniendo destino.
  if (isBareRoute(pathname)) {
    return (
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
    );
  }

  return (
    <CompactModeProvider>
      <ShellFrame pathname={pathname}>{children}</ShellFrame>
    </CompactModeProvider>
  );
}

/* ── Marco ─────────────────────────────────────────────────── */

function ShellFrame({
  pathname,
  children,
}: {
  pathname: string | null;
  children: React.ReactNode;
}) {
  const { isCompact, toggleCompact } = useCompactMode();
  const current = findSection(pathname);

  // El cajón recuerda la ruta en la que se abrió: al navegar queda cerrado
  // sin necesidad de un setState dentro de un efecto.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawerOpen = openedAt !== null && openedAt === pathname;
  const openDrawer = () => setOpenedAt(pathname ?? "");
  const closeDrawer = () => setOpenedAt(null);

  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Cajón abierto: bloqueo del fondo, foco atrapado, Escape y devolución del foco.
  useEffect(() => {
    if (!drawerOpen) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenedAt(null);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    // Si la ventana pasa a escritorio con el cajón abierto, se cierra.
    const mq = window.matchMedia(DESKTOP_QUERY);
    function onViewportChange(e: MediaQueryListEvent) {
      if (e.matches) setOpenedAt(null);
    }

    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onViewportChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onViewportChange);
      document.body.style.overflow = previousOverflow;
      // Devuelve el foco al botón que abrió el cajón (si sigue visible).
      if (trigger && trigger.offsetParent !== null) trigger.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* ── Barra lateral de escritorio (banner en lg; la barra móvil lo es por debajo) ── */}
      <header
        className={`hidden shrink-0 border-r border-[#222326] bg-[#111214] print:hidden lg:block ${
          isCompact ? "w-20" : "w-[264px]"
        } motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out`}
      >
        <div className="sticky top-0 flex h-dvh flex-col">
          <Brand compact={isCompact} />
          <SectionNav
            pathname={pathname}
            compact={isCompact}
            label="Secciones del panel"
            className={`flex-1 px-3 py-5 ${isCompact ? "overflow-visible" : "overflow-y-auto"}`}
          />
          <div className="space-y-1 border-t border-[#222326] px-3 py-3">
            <PublicSiteLink compact={isCompact} />
            <ToolButton
              compact={isCompact}
              icon={isCompact ? PanelLeftOpen : PanelLeftClose}
              label="Barra compacta"
              onClick={toggleCompact}
              pressed={isCompact}
            />
            <LogoutButton compact={isCompact} />
          </div>
        </div>
      </header>

      {/* ── Barra superior móvil y tableta ── */}
      <header
        inert={drawerOpen}
        className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[#222326] bg-[#111214] pl-1.5 pr-4 print:hidden lg:hidden"
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={openDrawer}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          className="flex size-11 items-center justify-center rounded-lg text-[#edebe4] hover:bg-white/[0.05]"
        >
          <Menu aria-hidden className="size-5" />
          <span className="sr-only">Abrir menú del panel</span>
        </button>
        <Link
          href="/admin/dashboard"
          className={`${ADMIN_FONT} flex min-h-11 items-center text-[15px] font-bold leading-none tracking-[-0.01em] text-[#edebe4] [font-stretch:125%]`}
        >
          Garage Studios
        </Link>
        {current && (
          <p className="ml-auto flex min-w-0 items-center gap-2 text-[14px] text-[#a3a6ab]">
            <SignalLed on />
            <span className="truncate">{current.label}</span>
          </p>
        )}
      </header>

      {/* ── Contenido ── */}
      <main
        id="contenido"
        tabIndex={-1}
        inert={drawerOpen}
        className="min-w-0 flex-1 outline-none"
      >
        {children}
      </main>

      {/* ── Cajón de navegación móvil ── */}
      <div
        className={`fixed inset-0 z-50 print:hidden lg:hidden ${
          drawerOpen ? "visible" : "invisible [transition:visibility_0s_linear_220ms]"
        }`}
      >
        <div
          aria-hidden
          onClick={closeDrawer}
          className={`absolute inset-0 bg-black/70 motion-safe:transition-opacity motion-safe:duration-200 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          ref={panelRef}
          id={drawerId}
          role="dialog"
          aria-modal="true"
          aria-label="Menú del panel"
          className={`absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col border-r border-[#222326] bg-[#111214] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-[#222326] pl-5 pr-2">
            <BrandText />
            <button
              ref={closeRef}
              type="button"
              onClick={closeDrawer}
              className="flex size-11 items-center justify-center rounded-lg text-[#a3a6ab] hover:bg-white/[0.05] hover:text-[#edebe4]"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">Cerrar menú</span>
            </button>
          </div>
          <SectionNav
            pathname={pathname}
            compact={false}
            label="Secciones del panel"
            onNavigate={closeDrawer}
            className="flex-1 overflow-y-auto px-3 py-5"
          />
          <div className="space-y-1 border-t border-[#222326] px-3 py-3">
            <PublicSiteLink compact={false} onNavigate={closeDrawer} />
            <LogoutButton compact={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Piezas ────────────────────────────────────────────────── */

/** Piloto de canal: encendido en ámbar solo para la sección en la que estás. */
function SignalLed({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`block size-[7px] shrink-0 rounded-full ${
        on
          ? "bg-[#f59e0b] shadow-[0_0_0_3px_rgba(245,158,11,0.16),0_0_10px_rgba(245,158,11,0.65)]"
          : "bg-[#2c2e32] group-hover/item:bg-[#4b4e54]"
      }`}
    />
  );
}

function BrandText() {
  return (
    <span className="flex flex-col">
      <span
        className={`${ADMIN_FONT} text-[17px] font-bold leading-none tracking-[-0.015em] text-[#edebe4] [font-stretch:125%]`}
      >
        Garage Studios
      </span>
      <span className="mt-1.5 text-[13px] leading-none text-[#8b8e94]">Consola del estudio</span>
    </span>
  );
}

function Brand({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex h-[72px] shrink-0 items-center border-b border-[#222326] ${
        compact ? "justify-center px-3" : "px-5"
      }`}
    >
      <Link
        href="/admin/dashboard"
        className="flex min-h-11 items-center rounded-md"
      >
        {compact ? (
          <>
            <span
              aria-hidden
              className={`${ADMIN_FONT} flex size-11 items-center justify-center rounded-md border border-[#2c2e32] text-[15px] font-extrabold tracking-[-0.02em] text-[#edebe4] [font-stretch:125%]`}
            >
              GS
            </span>
            <span className="sr-only">Garage Studios, ir al panel</span>
          </>
        ) : (
          <BrandText />
        )}
      </Link>
    </div>
  );
}

/** Etiqueta flotante del raíl compacto (decorativa: el nombre accesible ya existe). */
function RailTip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#2c2e32] bg-[#1a1b1e] px-2.5 py-1.5 text-[13px] text-[#edebe4] opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100 motion-safe:transition-opacity motion-safe:duration-150"
    >
      {label}
    </span>
  );
}

const ROW_BASE =
  "group/item relative flex h-11 w-full items-center rounded-[7px] text-[15px] leading-none outline-offset-2";

function rowLayout(compact: boolean) {
  return compact ? "justify-center gap-2 px-0" : "gap-3 px-3";
}

function SectionNav({
  pathname,
  compact,
  label,
  onNavigate,
  className = "",
}: {
  pathname: string | null;
  compact: boolean;
  label: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const idPrefix = useId();
  return (
    <nav aria-label={label} className={`${ADMIN_FONT} ${className}`}>
      {SECTION_GROUPS.map((group, index) => {
        const headingId = `${idPrefix}-grupo-${group.id}`;
        return (
          <div key={group.id} className={index > 0 ? (compact ? "mt-3 border-t border-[#222326] pt-3" : "mt-6") : ""}>
            <p
              id={headingId}
              className={
                compact
                  ? "sr-only"
                  : "mb-1.5 px-3 text-[13px] font-medium leading-none text-[#8b8e94]"
              }
            >
              {group.label}
            </p>
            <ul aria-labelledby={headingId} className="space-y-0.5">
              {group.items.map((item) => {
                const active = isSectionActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={`${ROW_BASE} ${rowLayout(compact)} ${
                        active
                          ? "bg-[#1b1c1f] font-semibold text-[#edebe4] shadow-[inset_0_0_0_1px_#2a2c30]"
                          : "text-[#a3a6ab] hover:bg-white/[0.035] hover:text-[#edebe4]"
                      }`}
                    >
                      <SignalLed on={active} />
                      <Icon
                        aria-hidden
                        strokeWidth={1.75}
                        className={`size-[18px] shrink-0 ${active ? "text-[#edebe4]" : "text-[#8b8e94] group-hover/item:text-[#c9cbce]"}`}
                      />
                      <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
                      {compact && <RailTip label={item.label} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Hueco del piloto: alinea los iconos de las herramientas con los de la navegación. */
function LedSpacer({ compact }: { compact: boolean }) {
  return compact ? null : <span aria-hidden className="block w-[7px] shrink-0" />;
}

const TOOL_TONE = "text-[#a3a6ab] hover:bg-white/[0.035] hover:text-[#edebe4]";

function PublicSiteLink({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={`${ADMIN_FONT} ${ROW_BASE} ${rowLayout(compact)} ${TOOL_TONE}`}
    >
      <LedSpacer compact={compact} />
      <Globe aria-hidden strokeWidth={1.75} className="size-[18px] shrink-0" />
      <span className={compact ? "sr-only" : "truncate"}>Ver la web pública</span>
      {compact && <RailTip label="Ver la web pública" />}
    </Link>
  );
}

function ToolButton({
  compact,
  icon: Icon,
  label,
  onClick,
  pressed,
}: {
  compact: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  pressed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`${ADMIN_FONT} ${ROW_BASE} ${rowLayout(compact)} ${TOOL_TONE}`}
    >
      <LedSpacer compact={compact} />
      <Icon aria-hidden strokeWidth={1.75} className="size-[18px] shrink-0" />
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
      {compact && <RailTip label={label} />}
    </button>
  );
}

function LogoutButton({ compact }: { compact: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`${ADMIN_FONT} ${ROW_BASE} ${rowLayout(compact)} ${TOOL_TONE}`}
      >
        <LedSpacer compact={compact} />
        <LogOut aria-hidden strokeWidth={1.75} className="size-[18px] shrink-0" />
        <span className={compact ? "sr-only" : "truncate"}>Cerrar sesión</span>
        {compact && <RailTip label="Cerrar sesión" />}
      </button>
    </form>
  );
}
