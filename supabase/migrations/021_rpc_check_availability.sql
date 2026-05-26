-- ============================================================
-- MIGRACIÓN 021: Función RPC para verificar disponibilidad
-- ============================================================
-- Función SECURITY DEFINER que permite a usuarios anónimos
-- consultar intervalos ocupados para una fecha, sin exponer
-- datos personales ni romper RLS.
-- Devuelve solo hora_inicio y hora_fin de reservas activas,
-- bloques activos y bloqueos manuales.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_fecha DATE)
RETURNS TABLE (
  hora_inicio TIME,
  hora_fin TIME
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reservas activas (pendiente o confirmada, no eliminadas)
  RETURN QUERY
    SELECT r.hora_inicio, r.hora_fin
    FROM public.reserva r
    WHERE r.fecha_reserva = p_fecha
      AND r.estado IN ('pendiente', 'confirmada')
      AND r.deleted_at IS NULL
      AND r.hora_inicio IS NOT NULL
      AND r.hora_fin IS NOT NULL;

  -- Bloques de reserva activos
  RETURN QUERY
    SELECT rb.hora_inicio, rb.hora_fin
    FROM public.reserva_bloque rb
    WHERE rb.fecha = p_fecha
      AND rb.estado IN ('pendiente', 'confirmada');

  -- Bloqueos manuales del administrador
  RETURN QUERY
    SELECT bh.hora_inicio, bh.hora_fin
    FROM public.bloqueo_horario bh
    WHERE bh.fecha = p_fecha
      AND bh.deleted_at IS NULL;
END;
$$;

-- Permitir que el rol anon ejecute esta función
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(DATE) TO authenticated;

-- ============================================================
-- ROLLBACK:
-- DROP FUNCTION IF EXISTS public.get_occupied_slots(DATE);
-- ============================================================
