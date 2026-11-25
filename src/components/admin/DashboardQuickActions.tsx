import { Plus } from "lucide-react";
import BlockTimeButton from "./BlockTimeButton";
import { LinkButton } from "./ui";

/**
 * Las dos acciones que se hacen a diario desde el panel. El resto de accesos
 * (calendario, clientes, finanzas, copias) ya están en la barra lateral.
 */
export default function DashboardQuickActions({ today }: { today: string }) {
  return (
    <>
      <BlockTimeButton initialDate={today} />
      <LinkButton href={`/admin/calendario/nueva?fecha=${today}`} variant="primary">
        <Plus aria-hidden /> Nueva reserva
      </LinkButton>
    </>
  );
}
