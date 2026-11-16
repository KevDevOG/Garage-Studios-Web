import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormAlertProps {
  message: string | null | undefined;
  tone?: "error" | "success";
  className?: string;
}

/**
 * Mensaje de estado de formulario accesible: se anuncia a lectores de pantalla
 * (role="alert") y mantiene el estilo de marca. No renderiza nada sin mensaje.
 */
export default function FormAlert({ message, tone = "error", className = "" }: FormAlertProps) {
  if (!message) return null;

  const styles =
    tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-green-500/30 bg-green-500/10 text-green-300";
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${styles} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
