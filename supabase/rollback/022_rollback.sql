-- ============================================================
-- ROLLBACK DE LA MIGRACIÓN 022 (transaccional)
-- ============================================================
-- Devuelve las políticas públicas, funciones y restricciones al estado
-- anterior a la 022. Úsalo solo si la 022 rompe la web (p. ej. las
-- solicitudes públicas fallan con "new row violates row-level security").
--
-- Lo que NO se revierte, a propósito:
--  * La normalización de fin a medianoche (00:00 → 24:00): la app actual
--    guarda 24:00; volver a 00:00 rompería la restricción reserva_no_overlap.
--  * Las FKs ON DELETE RESTRICT: volver a CASCADE reabre el borrado en cadena
--    de reservas. Bloque opcional al final, comentado.
--  * NOT NULL de estado_pago / importe_pagado / calendar_token: se quitan,
--    pero los valores rellenados se quedan (no hay forma de saber cuáles eran NULL).
--
-- OJO: sin SUPABASE_SERVICE_ROLE_KEY en Vercel, el enlace .ics del email deja
-- de funcionar al quitar la RPC get_reserva_by_calendar_token.
-- ============================================================

BEGIN;

-- 5. Trigger de solapamientos
DROP TRIGGER IF EXISTS trg_reserva_check_agenda_overlap ON public.reserva;
DROP FUNCTION IF EXISTS public.reserva_check_agenda_overlap();
DROP TRIGGER IF EXISTS trg_bloqueo_agenda_lock ON public.bloqueo_horario;
DROP TRIGGER IF EXISTS trg_reserva_bloque_agenda_lock ON public.reserva_bloque;
DROP FUNCTION IF EXISTS public.agenda_lock_fecha();

-- 4. Funciones
DROP FUNCTION IF EXISTS public.get_reserva_by_calendar_token(UUID);
ALTER FUNCTION public.handle_reserva_pagado_at() RESET search_path;

-- get_occupied_slots tal como la dejó la migración 021
CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_fecha DATE)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT r.hora_inicio, r.hora_fin
    FROM public.reserva r
    WHERE r.fecha_reserva = p_fecha
      AND r.estado IN ('pendiente', 'confirmada')
      AND r.deleted_at IS NULL
      AND r.hora_inicio IS NOT NULL
      AND r.hora_fin IS NOT NULL;

  RETURN QUERY
    SELECT rb.hora_inicio, rb.hora_fin
    FROM public.reserva_bloque rb
    WHERE rb.fecha = p_fecha
      AND rb.estado IN ('pendiente', 'confirmada');

  RETURN QUERY
    SELECT bh.hora_inicio, bh.hora_fin
    FROM public.bloqueo_horario bh
    WHERE bh.fecha = p_fecha
      AND bh.deleted_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(DATE) TO PUBLIC, anon, authenticated;

-- 2. Políticas públicas de 008/019
DROP POLICY IF EXISTS "reserva_public_insert" ON public.reserva;
CREATE POLICY "reserva_public_insert" ON public.reserva FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "contacto_public_insert" ON public.contacto;
CREATE POLICY "contacto_public_insert" ON public.contacto FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "cliente_public_insert" ON public.cliente;
CREATE POLICY "cliente_public_insert" ON public.cliente FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "cliente_anon_select_on_insert" ON public.cliente;
CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente FOR SELECT TO anon
  USING (current_setting('request.method', true) = 'POST');

-- 1. Restricciones y columnas
ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_horas;
ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_importes;
ALTER TABLE public.reserva_bloque DROP CONSTRAINT IF EXISTS ck_reserva_bloque_horas;
ALTER TABLE public.bloqueo_horario DROP CONSTRAINT IF EXISTS ck_bloqueo_horas;
ALTER TABLE public.reserva
  ALTER COLUMN estado_pago DROP NOT NULL,
  ALTER COLUMN importe_pagado DROP NOT NULL,
  ALTER COLUMN calendar_token DROP NOT NULL,
  ALTER COLUMN calendar_token SET DEFAULT uuid_generate_v4();

-- 6. Índices nuevos (inocuos; se quitan para dejar el esquema exacto)
DROP INDEX IF EXISTS public.idx_reserva_servicio_id;
DROP INDEX IF EXISTS public.idx_reserva_fecha_estado_activas;
DROP INDEX IF EXISTS public.idx_reserva_bloque_fecha;
DROP INDEX IF EXISTS public.idx_reserva_bloque_reserva_id;
DROP INDEX IF EXISTS public.idx_bloqueo_horario_fecha_activos;
DROP INDEX IF EXISTS public.idx_contacto_no_leido;
DROP INDEX IF EXISTS public.idx_cliente_servicio_favorito;
DROP INDEX IF EXISTS public.idx_finanza_servicio_id;
DROP INDEX IF EXISTS public.idx_servicio_admin_id;
DROP INDEX IF EXISTS public.idx_imagen_admin_id;

COMMIT;

-- ── OPCIONAL (NO recomendado): volver a borrar en cascada ──
-- BEGIN;
-- ALTER TABLE public.reserva DROP CONSTRAINT reserva_servicio_id_fkey,
--   ADD CONSTRAINT reserva_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(id) ON DELETE CASCADE;
-- ALTER TABLE public.servicio DROP CONSTRAINT servicio_admin_id_fkey,
--   ADD CONSTRAINT servicio_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.administrador(id) ON DELETE CASCADE;
-- ALTER TABLE public.imagen DROP CONSTRAINT imagen_admin_id_fkey,
--   ADD CONSTRAINT imagen_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.administrador(id) ON DELETE CASCADE;
-- COMMIT;
