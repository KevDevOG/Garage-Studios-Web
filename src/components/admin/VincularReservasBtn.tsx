"use client";

import { useState } from "react";
import { linkReservasToCliente } from "@/app/actions/clientes";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden="true" />
      )}
      Vincular reservas antiguas
    </button>
  );
}
