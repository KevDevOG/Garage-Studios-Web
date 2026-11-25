import { getStatusConfig, type StatusType } from "@/lib/status-colors";
import { Badge } from "./ui";

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
  showLabel?: boolean;
  /** Sin cápsula: solo punto y texto, para filas densas. */
  plain?: boolean;
}

/** Estado de reserva, pago, movimiento, mensaje o cliente con su tono. */
export default function StatusBadge({
  type,
  value,
  className,
  showLabel = true,
  plain = false,
}: StatusBadgeProps) {
  const config = getStatusConfig(type, value);

  return (
    <Badge tone={config.tone} plain={plain} className={className}>
      {showLabel ? config.label : value}
    </Badge>
  );
}
