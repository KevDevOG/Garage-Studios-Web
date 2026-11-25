"use client";

import { useState } from "react";
import { linkReservasToCliente } from "@/app/actions/clientes";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buttonClass } from "./ui";

interface VincularReservasBtnProps {
  clienteId: string;
}

export default function VincularReservasBtn({ clienteId }: VincularReservasBtnProps) {
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      const result = await linkReservasToCliente(clienteId);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.count > 0) {
        toast.success(`Se han vinculado ${result.data.count} reservas antiguas.`);
      } else {
        toast.info("No se encontraron reservas pendientes de vincular.");
      }
    } catch {
      toast.error("Error al vincular reservas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLink}
      disabled={loading}
      aria-busy={loading}
      className={buttonClass("ghost", "sm")}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      Vincular reservas antiguas
    </button>
  );
}
