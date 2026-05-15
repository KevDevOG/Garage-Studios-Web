import { AlertCircle, Calendar, MessageSquare, Clock, MailWarning } from "lucide-react";
import Link from "next/link";

interface AdminAlertsProps {
  pendingReservations: number;
  unreadMessages: number;
  todayCitations: number;
  emailErrors: number;
  pendingPayments?: number;
}

export default function AdminAlerts({ 
  pendingReservations, 
  unreadMessages, 
  todayCitations, 
  emailErrors,
  pendingPayments = 0
}: AdminAlertsProps) {
  const alerts = [
    {
      show: pendingReservations > 0,
      title: `${pendingReservations} Reservas pendientes`,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/5",
      border: "border-amber-400/20",
      href: "/admin/dashboard",
    },
    {
      show: unreadMessages > 0,
      title: `${unreadMessages} Mensajes sin leer`,
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-400/5",
      border: "border-blue-400/20",
      href: "/admin/dashboard#mensajes",
    },
    {
      show: todayCitations > 0,
      title: `${todayCitations} Citas para hoy`,
      icon: Calendar,
      color: "text-green-400",
      bg: "bg-green-400/5",
      border: "border-green-400/20",
      href: "/admin/calendario",
    },
    {
      show: emailErrors > 0,
      title: `${emailErrors} Errores de envío de email`,
      icon: MailWarning,
      color: "text-red-400",
      bg: "bg-red-400/5",
      border: "border-red-400/20",
      href: "/admin/auditoria",
    },
    {
      show: pendingPayments > 0,
      title: `${pendingPayments} Pagos pendientes`,
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-400/5",
      border: "border-purple-400/20",
      href: "/admin/finanzas",
    },
  ].filter(a => a.show);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {alerts.map((alert, idx) => (
        <Link 
          key={idx} 
          href={alert.href}
          className={`flex items-center gap-3 p-4 rounded-xl border ${alert.border} ${alert.bg} transition-all hover:scale-[1.02] active:scale-95`}
        >
          <div className={`p-2 rounded-lg bg-black/20 ${alert.color}`}>
            <alert.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold truncate ${alert.color}`}>{alert.title}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted/60 font-black">Acción requerida</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
