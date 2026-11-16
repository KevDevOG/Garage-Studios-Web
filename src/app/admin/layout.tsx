import type { Metadata } from "next";

// El panel no debe indexarse (además de la regla de robots.txt, se envía la
// meta robots en cada página de /admin) y lleva su propio título.
export const metadata: Metadata = {
  title: "Panel de administración | Garage Studios",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
