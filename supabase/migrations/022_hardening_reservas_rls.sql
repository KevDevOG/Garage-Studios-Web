-- ============================================================
-- MIGRACIÓN 022: Endurecimiento de reservas, RLS pública e índices
-- Garage Studios — Auditoría integral v1 (noviembre 2026), revisión 2
-- ============================================================
-- ESTADO: PROPUESTA. NO se ha aplicado en producción. Aplicar primero en una
-- rama/staging de Supabase y ejecutar supabase/tests/022_023_verificacion.sql.
-- Procedimiento completo y rollback: docs/migraciones-022-023.md
--
-- Es transaccional: si cualquier comprobación falla, no se aplica nada.
-- Independiente de la 023 (lista privada de administradores): se pueden
-- aplicar en cualquier orden, aunque el orden recomendado es 023 → 022.
--
-- Cambios de código que la acompañan (ya en la rama):
--  * La app guarda el fin de sesión a medianoche como TIME '24:00'
--    (minutesToTime). `fecha + '24:00'` es la medianoche del día SIGUIENTE,
--    así que el tsrange del EXCLUDE ya no se invierte.
--  * /api/calendar/[token] usa la RPC get_reserva_by_calendar_token cuando no
--    hay SUPABASE_SERVICE_ROLE_KEY.
--  * Los errores 23P01 (exclusion_violation) se muestran como "horario no
--    disponible" en la web y en el panel.
--
-- Revisión 2 (respecto a la propuesta inicial):
--  * El bloque de audit_log pasa a la 023 (necesita private.is_admin()).
--  * La política anon de reserva comprueba además servicio activo, precio y
--    duración del servicio, consentimiento de privacidad y campos internos.
--  * imagen.admin_id deja de borrar en cascada.
--  * Nuevo trigger: una reserva no puede caer sobre un bloqueo manual ni
--    sobre un bloque de pack de otra reserva (antes solo lo comprobaba la app,
--    y con la anon key pública se podía saltar).
--  * Comprobaciones finales (postflight) dentro de la misma transacción.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. NORMALIZACIÓN + PREFLIGHT
-- ─────────────────────────────────────────────────────────────
-- Reservas antiguas que terminaban "a las 00:00" (medianoche): solo las de
-- cierre (inicio > 00:00). Medido el 16-nov-2026: 1 fila (completada).
UPDATE public.reserva
SET hora_fin = TIME '24:00'
WHERE hora_fin = TIME '00:00' AND hora_inicio IS NOT NULL AND hora_inicio > TIME '00:00';

-- Lo mismo para bloques de pack y bloqueos manuales (medido: 0 filas).
UPDATE public.reserva_bloque
SET hora_fin = TIME '24:00'
WHERE hora_fin = TIME '00:00' AND hora_inicio > TIME '00:00';

UPDATE public.bloqueo_horario
SET hora_fin = TIME '24:00'
WHERE hora_fin = TIME '00:00' AND hora_inicio > TIME '00:00';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reserva
    WHERE estado IN ('pendiente','confirmada') AND deleted_at IS NULL
      AND (hora_inicio IS NULL OR hora_fin IS NULL OR hora_fin <= hora_inicio)
  ) THEN
    RAISE EXCEPTION '022: hay reservas activas con horas nulas o fin <= inicio; corrígelas antes de aplicar';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reserva
    GROUP BY calendar_token HAVING count(*) > 1 AND calendar_token IS NOT NULL
  ) THEN
    RAISE EXCEPTION '022: hay calendar_token duplicados';
  END IF;
END $$;

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

-- NOT VALID: no revalida el histórico (ya comprobado), sí toda fila nueva o editada.
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
-- 2. POLÍTICAS RLS PÚBLICAS: el rol anon solo puede insertar lo que la web envía
-- ─────────────────────────────────────────────────────────────
-- Antes: WITH CHECK (true) permitía, con la anon key pública, insertar
-- reservas "confirmadas"/"pagadas", con precio 0, filas con horas NULL o
-- spam saltándose Turnstile y el rate limit.
-- Límites de longitud más holgados que los de la app (src/lib/reservation-rules.ts)
-- para no rechazar nunca un envío legítimo.
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
    AND calendar_event_id IS NULL
    AND origen = 'web'
    AND accepted_privacy_at IS NOT NULL
    AND hora_inicio IS NOT NULL
    AND hora_fin IS NOT NULL
    AND hora_fin > hora_inicio
    AND confirmacion_email_enviada_at IS NULL
    AND confirmacion_whatsapp_enviada_at IS NULL
    AND cancelacion_email_enviada_at IS NULL
    AND completada_email_enviada_at IS NULL
    AND confirmacion_error IS NULL
    AND email_estado_error IS NULL
    AND fecha_reserva >= (now() AT TIME ZONE 'Atlantic/Canary')::date
    AND fecha_reserva <= (now() AT TIME ZONE 'Atlantic/Canary')::date + 730
    AND length(nombre) BETWEEN 2 AND 200
    AND length(email) <= 254
    AND length(telefono) <= 40
    AND length(coalesce(observaciones, '')) <= 2000
    -- Servicio activo, con su precio y su duración reales. La subconsulta
    -- corre con permisos de anon: la política servicio_public_read le deja
    -- ver los servicios activos.
    -- OJO: las columnas de la fila nueva van calificadas con `reserva.`; sin
    -- calificar, `precio` y `duracion_minutos` se resolverían contra `s`.
    AND EXISTS (
      SELECT 1 FROM public.servicio s
      WHERE s.id = reserva.servicio_id
        AND s.activo = true
        AND s.precio IS NOT DISTINCT FROM reserva.precio
        AND s.duracion_minutos = reserva.duracion_minutos
    )
    -- La duración guardada coincide con el intervalo (24:00 = 86400 s).
    AND extract(epoch FROM hora_fin) - extract(epoch FROM hora_inicio) = duracion_minutos * 60
  );

DROP POLICY IF EXISTS "contacto_public_insert" ON public.contacto;
CREATE POLICY "contacto_public_insert" ON public.contacto
  FOR INSERT TO anon
  WITH CHECK (
    coalesce(leido, false) = false
    AND accepted_privacy_at IS NOT NULL
    AND length(nombre) BETWEEN 2 AND 200
    AND length(email) <= 254
    AND length(coalesce(telefono, '')) <= 40
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
    AND coalesce(reservas_confirmadas, 0) = 0
    AND coalesce(reservas_canceladas, 0) = 0
    AND coalesce(reservas_completadas, 0) = 0
    AND coalesce(importe_total, 0) = 0
    AND notas IS NULL
    AND servicio_favorito_id IS NULL
    AND ultima_reserva_at IS NULL
    AND coalesce(array_length(etiquetas, 1), 0) = 0
    AND length(nombre) BETWEEN 2 AND 200
  );

-- La política de 019 (request.method = 'POST') permitía a cualquier POST anon
-- (también a /rpc/*) leer TODA la tabla cliente. Ahora solo es visible la fila
-- insertada en la misma transacción: PostgREST hace INSERT … RETURNING en una
-- única sentencia y `created_at` toma por defecto el now() de esa transacción.
DROP POLICY IF EXISTS "cliente_anon_select_on_insert" ON public.cliente;
CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente
  FOR SELECT TO anon
  USING (created_at = now());

-- ─────────────────────────────────────────────────────────────
-- 3. CLAVES AJENAS SIN BORRADO EN CASCADA DESTRUCTIVO
-- ─────────────────────────────────────────────────────────────
-- Borrar un administrador borraba sus servicios e imágenes y, en cascada,
-- TODAS las reservas de esos servicios.
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
        OR (conrelid = 'public.imagen'::regclass AND confrelid = 'public.administrador'::regclass)
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

ALTER TABLE public.imagen
  ADD CONSTRAINT imagen_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.administrador(id) ON DELETE RESTRICT;

-- ─────────────────────────────────────────────────────────────
-- 4. FUNCIONES RPC
-- ─────────────────────────────────────────────────────────────
-- 4.1 get_occupied_slots: search_path vacío y los bloques de pack solo
--     cuentan si su reserva padre sigue activa. Ejecutable por anon A
--     PROPÓSITO (aviso 0028 del linter aceptado): devuelve solo horas.
CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_fecha DATE)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME)
LANGUAGE plpgsql
STABLE
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

REVOKE ALL ON FUNCTION public.get_occupied_slots(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(DATE) TO anon, authenticated;

-- 4.2 Lectura de una reserva por token de calendario (para el .ics del email).
--     Minimización de datos: devuelve SOLO fecha, horas y nombre del servicio
--     (ningún dato personal: ni nombre, ni email, ni teléfono, ni importes).
--     Solo reservas pendientes/confirmadas/completadas y, como mucho, hasta
--     30 días después de la sesión: un enlace reenviado o filtrado caduca.
--     El token es un UUID v4 aleatorio (122 bits): no es enumerable.
DROP FUNCTION IF EXISTS public.get_reserva_by_calendar_token(UUID);
CREATE FUNCTION public.get_reserva_by_calendar_token(p_token UUID)
RETURNS TABLE (
  fecha_reserva DATE,
  hora_inicio TIME,
  hora_fin TIME,
  servicio_nombre TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT r.fecha_reserva, r.hora_inicio, r.hora_fin, s.nombre
  FROM public.reserva r
  LEFT JOIN public.servicio s ON s.id = r.servicio_id
  WHERE p_token IS NOT NULL
    AND r.calendar_token = p_token
    AND r.deleted_at IS NULL
    AND r.estado IN ('pendiente','confirmada','completada')
    AND r.fecha_reserva >= (now() AT TIME ZONE 'Atlantic/Canary')::date - 30;
$$;

REVOKE ALL ON FUNCTION public.get_reserva_by_calendar_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reserva_by_calendar_token(UUID) TO anon, authenticated;

-- 4.3 Trigger de pagado_at: fijar search_path (aviso 0011 del linter).
--     Su cuerpo solo usa NOW() (pg_catalog), así que '' es seguro.
ALTER FUNCTION public.handle_reserva_pagado_at() SET search_path = '';

-- ─────────────────────────────────────────────────────────────
-- 5. SOLAPAMIENTOS ENTRE TABLAS (reserva ↔ bloqueo manual / bloque de pack)
-- ─────────────────────────────────────────────────────────────
-- El EXCLUDE reserva_no_overlap (020) ya impide, de forma atómica, que dos
-- reservas activas se solapen. Pero una reserva podía caer sobre un bloqueo
-- manual o un bloque de pack: solo lo comprobaba la app, y un INSERT directo
-- con la anon key se lo saltaba.
--
-- Se comprueba al crear la reserva y al MOVERLA (cambio de fecha u horas),
-- no al cambiar solo el estado: así el admin puede seguir confirmando una
-- reserva sobre la que después puso un bloqueo a propósito.
-- SECURITY DEFINER porque anon no puede leer bloqueo_horario ni reserva_bloque.
-- Error 23P01 (exclusion_violation): la app ya lo traduce a "horario no disponible".
CREATE OR REPLACE FUNCTION public.reserva_check_agenda_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inicio timestamp;
  v_fin timestamp;
BEGIN
  -- Filas inactivas o con horas incompletas/invertidas: las rechaza (o
  -- acepta) ck_reserva_horas, con su propio error; aquí no se evalúan para
  -- no construir un tsrange inválido.
  IF NEW.estado NOT IN ('pendiente','confirmada') OR NEW.deleted_at IS NOT NULL
     OR NEW.hora_inicio IS NULL OR NEW.hora_fin IS NULL
     OR NEW.hora_fin <= NEW.hora_inicio THEN
    RETURN NEW;
  END IF;

  v_inicio := NEW.fecha_reserva + NEW.hora_inicio;
  v_fin := NEW.fecha_reserva + NEW.hora_fin;

  IF EXISTS (
    SELECT 1 FROM public.bloqueo_horario bh
    WHERE bh.fecha = NEW.fecha_reserva
      AND bh.deleted_at IS NULL
      AND tsrange(bh.fecha + bh.hora_inicio, bh.fecha + bh.hora_fin) && tsrange(v_inicio, v_fin)
  ) THEN
    RAISE EXCEPTION 'reserva_no_overlap: el horario coincide con un bloqueo de agenda'
      USING ERRCODE = 'exclusion_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reserva_bloque rb
    JOIN public.reserva r ON r.id = rb.reserva_id
    WHERE rb.fecha = NEW.fecha_reserva
      AND rb.reserva_id <> NEW.id
      AND rb.estado IN ('pendiente','confirmada')
      AND r.estado IN ('pendiente','confirmada')
      AND r.deleted_at IS NULL
      AND tsrange(rb.fecha + rb.hora_inicio, rb.fecha + rb.hora_fin) && tsrange(v_inicio, v_fin)
  ) THEN
    RAISE EXCEPTION 'reserva_no_overlap: el horario coincide con una sesión de un pack'
      USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reserva_check_agenda_overlap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reserva_check_agenda_overlap ON public.reserva;
CREATE TRIGGER trg_reserva_check_agenda_overlap
  BEFORE INSERT OR UPDATE OF fecha_reserva, hora_inicio, hora_fin ON public.reserva
  FOR EACH ROW EXECUTE FUNCTION public.reserva_check_agenda_overlap();

-- ─────────────────────────────────────────────────────────────
-- 6. ÍNDICES (FKs sin cubrir y consultas de disponibilidad)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reserva_servicio_id ON public.reserva(servicio_id);
CREATE INDEX IF NOT EXISTS idx_reserva_fecha_estado_activas
  ON public.reserva(fecha_reserva, estado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reserva_bloque_fecha ON public.reserva_bloque(fecha);
CREATE INDEX IF NOT EXISTS idx_reserva_bloque_reserva_id ON public.reserva_bloque(reserva_id);
CREATE INDEX IF NOT EXISTS idx_bloqueo_horario_fecha_activos
  ON public.bloqueo_horario(fecha) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacto_no_leido
  ON public.contacto(created_at DESC) WHERE leido = false;
CREATE INDEX IF NOT EXISTS idx_cliente_servicio_favorito ON public.cliente(servicio_favorito_id);
CREATE INDEX IF NOT EXISTS idx_finanza_servicio_id ON public.finanza_movimiento(servicio_id);
CREATE INDEX IF NOT EXISTS idx_servicio_admin_id ON public.servicio(admin_id);
CREATE INDEX IF NOT EXISTS idx_imagen_admin_id ON public.imagen(admin_id);

-- ─────────────────────────────────────────────────────────────
-- 7. POSTFLIGHT: si algo no quedó como se espera, se revierte todo
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND 'anon' = ANY (roles)
      AND cmd = 'INSERT' AND with_check = 'true'
  ) THEN
    RAISE EXCEPTION '022: sigue existiendo una política INSERT anon con WITH CHECK (true)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype = 'f' AND confdeltype = 'c'
      AND confrelid IN ('public.servicio'::regclass, 'public.administrador'::regclass)
  ) THEN
    RAISE EXCEPTION '022: queda una FK con ON DELETE CASCADE hacia servicio o administrador';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_reserva_check_agenda_overlap' AND tgrelid = 'public.reserva'::regclass
  ) THEN
    RAISE EXCEPTION '022: no se creó el trigger de solapamientos';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- ROLLBACK: supabase/rollback/022_rollback.sql (transaccional).
-- ============================================================
