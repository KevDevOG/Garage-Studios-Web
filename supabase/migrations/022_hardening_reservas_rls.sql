-- ============================================================
-- MIGRACIÓN 022: Endurecimiento de reservas, RLS e índices
-- Garage Studios — Auditoría integral v1 (noviembre 2026)
-- ============================================================
-- ESTADO: PROPUESTA. NO se ha aplicado en producción. Revisar y ejecutar
-- primero en una rama/staging de Supabase. Toda la migración es
-- transaccional: si una comprobación falla, no se aplica nada.
--
-- Contexto de los cambios de código que la acompañan (misma rama):
--  * La app guarda el fin de sesión a medianoche como TIME '24:00'
--    (minutesToTime). Postgres acepta ese valor y `fecha + '24:00'`
--    es la medianoche del día SIGUIENTE, así que el tsrange del EXCLUDE
--    deja de invertirse. Antes se guardaba '00:00' y el INSERT fallaba
--    con 22000 ("range lower bound must be less than or equal...").
--  * La ruta /api/calendar/[token] usa la RPC get_reserva_by_calendar_token
--    cuando no hay SUPABASE_SERVICE_ROLE_KEY.
--  * El formulario público valida en servidor horario, día y fecha.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. PREFLIGHT: no debe haber reservas activas con horas inválidas
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reserva
    WHERE estado IN ('pendiente','confirmada') AND deleted_at IS NULL
      AND (hora_inicio IS NULL OR hora_fin IS NULL OR hora_fin <= hora_inicio)
  ) THEN
    RAISE EXCEPTION '022: hay reservas activas con horas nulas o fin <= inicio; corrígelas antes de aplicar';
  END IF;
END $$;

-- Normalizar reservas antiguas que terminaban "a las 00:00" (medianoche):
-- solo las que claramente son de cierre (inicio > 00:00 y fin = 00:00).
UPDATE public.reserva
SET hora_fin = TIME '24:00'
WHERE hora_fin = TIME '00:00' AND hora_inicio IS NOT NULL AND hora_inicio > TIME '00:00';

-- ─────────────────────────────────────────────────────────────
-- 1. INTEGRIDAD DE HORAS E IMPORTES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_horas;
ALTER TABLE public.reserva ADD CONSTRAINT ck_reserva_horas CHECK (
  -- Las reservas inactivas o borradas pueden tener horas incompletas (datos históricos)
  estado NOT IN ('pendiente','confirmada') OR deleted_at IS NOT NULL
  OR (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio)
);

UPDATE public.reserva SET estado_pago = 'pendiente' WHERE estado_pago IS NULL;
UPDATE public.reserva SET importe_pagado = 0 WHERE importe_pagado IS NULL;
UPDATE public.reserva SET calendar_token = gen_random_uuid() WHERE calendar_token IS NULL;

ALTER TABLE public.reserva
  ALTER COLUMN estado_pago SET NOT NULL,
  ALTER COLUMN importe_pagado SET NOT NULL,
  ALTER COLUMN calendar_token SET NOT NULL,
  ALTER COLUMN calendar_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_importes;
ALTER TABLE public.reserva ADD CONSTRAINT ck_reserva_importes
  CHECK (importe_pagado >= 0 AND (precio IS NULL OR precio >= 0)) NOT VALID;

ALTER TABLE public.reserva_bloque DROP CONSTRAINT IF EXISTS ck_reserva_bloque_horas;
ALTER TABLE public.reserva_bloque ADD CONSTRAINT ck_reserva_bloque_horas
  CHECK (hora_fin > hora_inicio) NOT VALID;

ALTER TABLE public.bloqueo_horario DROP CONSTRAINT IF EXISTS ck_bloqueo_horas;
ALTER TABLE public.bloqueo_horario ADD CONSTRAINT ck_bloqueo_horas
  CHECK (hora_fin > hora_inicio) NOT VALID;

-- ─────────────────────────────────────────────────────────────
-- 2. POLÍTICAS RLS: el rol anon solo puede insertar lo que la web envía
-- ─────────────────────────────────────────────────────────────
-- Antes: WITH CHECK (true) permitía, con la anon key pública, insertar
-- reservas "confirmadas"/"pagadas", filas con horas NULL (que bloquean toda
-- la agenda vía EXCLUDE) o spam saltándose Turnstile y rate limit.
DROP POLICY IF EXISTS "reserva_public_insert" ON public.reserva;
CREATE POLICY "reserva_public_insert" ON public.reserva
  FOR INSERT TO anon
  WITH CHECK (
    estado = 'pendiente'
    AND estado_pago = 'pendiente'
    AND importe_pagado = 0
    AND pagado_at IS NULL
    AND deleted_at IS NULL
    AND notas_admin IS NULL
    AND origen = 'web'
    AND hora_inicio IS NOT NULL
    AND hora_fin IS NOT NULL
    AND hora_fin > hora_inicio
    AND confirmacion_email_enviada_at IS NULL
    AND confirmacion_whatsapp_enviada_at IS NULL
    AND cancelacion_email_enviada_at IS NULL
    AND completada_email_enviada_at IS NULL
    AND fecha_reserva >= (now() AT TIME ZONE 'Atlantic/Canary')::date
    AND length(nombre) BETWEEN 2 AND 200
    AND length(coalesce(observaciones, '')) <= 2000
  );

DROP POLICY IF EXISTS "contacto_public_insert" ON public.contacto;
CREATE POLICY "contacto_public_insert" ON public.contacto
  FOR INSERT TO anon
  WITH CHECK (
    coalesce(leido, false) = false
    AND length(nombre) BETWEEN 2 AND 200
    AND length(asunto) <= 200
    AND length(mensaje) <= 5000
  );

DROP POLICY IF EXISTS "cliente_public_insert" ON public.cliente;
CREATE POLICY "cliente_public_insert" ON public.cliente
  FOR INSERT TO anon
  WITH CHECK (
    origen = 'web'
    AND estado = 'activo'
    AND coalesce(total_reservas, 0) = 0
    AND coalesce(importe_total, 0) = 0
    AND notas IS NULL
    AND coalesce(array_length(etiquetas, 1), 0) = 0
  );

-- La política de 019 (request.method = 'POST') permitía a cualquier POST anon
-- leer la tabla cliente. Limitamos la lectura a la fila recién insertada en
-- la misma transacción (PostgREST devuelve la representación en ese contexto).
DROP POLICY IF EXISTS "cliente_anon_select_on_insert" ON public.cliente;
CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente
  FOR SELECT TO anon
  USING (created_at = now());

-- El log de auditoría debe ser inmutable: solo lectura e inserción.
DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_insert" ON public.audit_log;
CREATE POLICY "audit_admin_select" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_admin_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. CLAVES AJENAS SIN BORRADO EN CASCADA DESTRUCTIVO
-- ─────────────────────────────────────────────────────────────
-- Borrar un administrador borraba sus servicios y, en cascada, TODAS las
-- reservas de esos servicios.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass AS tabla, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND (
        (conrelid = 'public.reserva'::regclass AND confrelid = 'public.servicio'::regclass)
        OR (conrelid = 'public.servicio'::regclass AND confrelid = 'public.administrador'::regclass)
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tabla, r.conname);
  END LOOP;
END $$;

ALTER TABLE public.reserva
  ADD CONSTRAINT reserva_servicio_id_fkey
  FOREIGN KEY (servicio_id) REFERENCES public.servicio(id) ON DELETE RESTRICT;

ALTER TABLE public.servicio
  ADD CONSTRAINT servicio_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.administrador(id) ON DELETE RESTRICT;

-- ─────────────────────────────────────────────────────────────
-- 4. FUNCIONES RPC
-- ─────────────────────────────────────────────────────────────
-- 4.1 get_occupied_slots: search_path vacío (aviso del linter) y los bloques
--     de pack solo cuentan si su reserva padre sigue activa.
CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_fecha DATE)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
    SELECT r.hora_inicio, r.hora_fin
    FROM public.reserva r
    WHERE r.fecha_reserva = p_fecha
      AND r.estado IN ('pendiente','confirmada')
      AND r.deleted_at IS NULL
      AND r.hora_inicio IS NOT NULL
      AND r.hora_fin IS NOT NULL;

  RETURN QUERY
    SELECT rb.hora_inicio, rb.hora_fin
    FROM public.reserva_bloque rb
    WHERE rb.fecha = p_fecha
      AND rb.estado IN ('pendiente','confirmada')
      AND EXISTS (
        SELECT 1 FROM public.reserva r
        WHERE r.id = rb.reserva_id
          AND r.deleted_at IS NULL
          AND r.estado IN ('pendiente','confirmada')
      );

  RETURN QUERY
    SELECT bh.hora_inicio, bh.hora_fin
    FROM public.bloqueo_horario bh
    WHERE bh.fecha = p_fecha
      AND bh.deleted_at IS NULL;
END;
$$;

-- 4.2 Lectura de una reserva por token de calendario (para el .ics del email).
--     Devuelve solo lo imprescindible y únicamente reservas no canceladas.
CREATE OR REPLACE FUNCTION public.get_reserva_by_calendar_token(p_token UUID)
RETURNS TABLE (
  nombre TEXT,
  fecha_reserva DATE,
  hora_inicio TIME,
  hora_fin TIME,
  servicio_nombre TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT r.nombre, r.fecha_reserva, r.hora_inicio, r.hora_fin, s.nombre
  FROM public.reserva r
  LEFT JOIN public.servicio s ON s.id = r.servicio_id
  WHERE r.calendar_token = p_token
    AND r.deleted_at IS NULL
    AND r.estado NOT IN ('cancelada','rechazada');
$$;

REVOKE ALL ON FUNCTION public.get_reserva_by_calendar_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reserva_by_calendar_token(UUID) TO anon, authenticated;

-- 4.3 Trigger de pagado_at: fijar search_path (aviso del linter de Supabase)
ALTER FUNCTION public.handle_reserva_pagado_at() SET search_path = '';

-- ─────────────────────────────────────────────────────────────
-- 5. ÍNDICES (FKs sin cubrir y consultas de disponibilidad)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reserva_servicio_id ON public.reserva(servicio_id);
CREATE INDEX IF NOT EXISTS idx_reserva_fecha_estado_activas
  ON public.reserva(fecha_reserva, estado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacto_no_leido
  ON public.contacto(created_at DESC) WHERE leido = false;
CREATE INDEX IF NOT EXISTS idx_cliente_servicio_favorito ON public.cliente(servicio_favorito_id);
CREATE INDEX IF NOT EXISTS idx_finanza_servicio_id ON public.finanza_movimiento(servicio_id);

COMMIT;

-- ============================================================
-- ROLLBACK (ejecutar en una transacción si hace falta revertir)
-- ============================================================
-- ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_horas;
-- ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_importes;
-- ALTER TABLE public.reserva_bloque DROP CONSTRAINT IF EXISTS ck_reserva_bloque_horas;
-- ALTER TABLE public.bloqueo_horario DROP CONSTRAINT IF EXISTS ck_bloqueo_horas;
-- ALTER TABLE public.reserva ALTER COLUMN estado_pago DROP NOT NULL,
--   ALTER COLUMN importe_pagado DROP NOT NULL, ALTER COLUMN calendar_token DROP NOT NULL,
--   ALTER COLUMN calendar_token SET DEFAULT uuid_generate_v4();
-- Restaurar policies de 008/019:
--   CREATE POLICY "reserva_public_insert" ON public.reserva FOR INSERT TO anon WITH CHECK (true);
--   CREATE POLICY "contacto_public_insert" ON public.contacto FOR INSERT TO anon WITH CHECK (true);
--   CREATE POLICY "cliente_public_insert" ON public.cliente FOR INSERT TO anon WITH CHECK (true);
--   CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente FOR SELECT TO anon
--     USING (current_setting('request.method', true) = 'POST');
--   CREATE POLICY "audit_admin_all" ON public.audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- FKs: volver a ON DELETE CASCADE solo si se acepta el riesgo.
-- DROP FUNCTION IF EXISTS public.get_reserva_by_calendar_token(UUID);
-- Reponer get_occupied_slots con la definición de 021.
-- DROP INDEX IF EXISTS idx_reserva_servicio_id, idx_reserva_fecha_estado_activas,
--   idx_contacto_no_leido, idx_cliente_servicio_favorito, idx_finanza_servicio_id;
-- ============================================================
