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
    try {
      setLoading(true);
      const { count } = await linkReservasToCliente(clienteId);
      
      if (count > 0) {
        toast.success(`Se han vinculado ${count} reservas antiguas.`);
      } else {
        toast.success("No se encontraron reservas pendientes de vincular.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al vincular reservas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLink}
      disabled={loading}
      className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full mt-4"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Link2 className="w-4 h-4" />
      )}
      Vincular reservas antiguas
    </button>
  );
}
