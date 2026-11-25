import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import AdminShell from "@/components/admin/AdminShell";

// El panel no debe indexarse (además de la regla de robots.txt, se envía la
// meta robots en cada página de /admin) y lleva su propio título.
export const metadata: Metadata = {
  title: "Panel de administración | Garage Studios",
  robots: { index: false, follow: false, nocache: true },
};

// Tipografía del marco del panel (solo /admin). Archivo variable con eje de
// anchura: expandida para la marca y los títulos, normal para la navegación.
// La clase gs-admin (globals.css) la aplica a todo el panel, con cifras tabulares.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-admin",
  display: "swap",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // display: contents → solo aporta la fuente y los tokens del panel (que se
    // heredan), sin caja propia que rompa el flex del <body>.
    <div className={`${archivo.variable} gs-admin contents`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
