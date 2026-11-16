-- ============================================================
-- PRUEBAS DE LAS MIGRACIONES 022 + 023 (RLS, allowlist, solapamientos, .ics)
-- ============================================================
-- DÓNDE: SOLO en una rama de Supabase o en staging, DESPUÉS de aplicar 022 y
-- 023. NUNCA en producción: crea filas de prueba y bloquea tablas mientras
-- dura (todo se deshace con el ROLLBACK final, pero no es para producción).
--
-- CÓMO: pegar el archivo entero en el SQL Editor y ejecutarlo. Cada prueba
-- emite "OK …" (NOTICE). La primera que falle aborta con "FALLO …" y, al ser
-- una sola transacción, no queda nada escrito.
-- Resultado esperado: última línea "TODAS LAS PRUEBAS 022/023 SUPERADAS".
--
-- Simula los roles reales de PostgREST: `anon` (web pública con la anon key),
-- `authenticated` sin estar en la lista (alguien que se registró) y
-- `authenticated` administrador.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- FIXTURES (como propietario de las tablas)
-- ─────────────────────────────────────────────────────────────
SELECT set_config('t.admin', (
  SELECT a.id::text FROM public.administrador a
  JOIN auth.users u ON u.id = a.id
  WHERE u.deleted_at IS NULL LIMIT 1
), true);
SELECT set_config('t.fecha', ((now() AT TIME ZONE 'Atlantic/Canary')::date + 300)::text, true);
SELECT set_config('t.intruso', '00000000-0000-4000-8000-0000000000ff', true);

DO $$ BEGIN
  IF current_setting('t.admin', true) IS NULL OR current_setting('t.admin', true) = '' THEN
    RAISE EXCEPTION 'FALLO preparación: no hay ningún administrador con cuenta en Auth';
  END IF;
END $$;

INSERT INTO public.servicio (id, admin_id, nombre, descripcion, precio, duracion_minutos, activo, categoria)
VALUES ('00000000-0000-4000-8000-000000000001', current_setting('t.admin')::uuid,
        'TEST 022', 'fixture de pruebas', 40, 60, true, 'Sonido');

INSERT INTO public.bloqueo_horario (fecha, hora_inicio, hora_fin, motivo)
VALUES (current_setting('t.fecha')::date, '18:00', '20:00', 'TEST 022');

-- Reserva confirmada con token conocido (enlace .ics vigente)
INSERT INTO public.reserva (id, servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin,
                            duracion_minutos, estado, origen, calendar_token, precio, accepted_privacy_at)
VALUES ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001',
        'Fixture Vigente', 'fixture@example.com', '600000000', current_setting('t.fecha')::date,
        '10:00', '11:00', 60, 'confirmada', 'manual', '00000000-0000-4000-8000-0000000000aa', 40, now());

-- Reserva completada hace 40 días (enlace .ics caducado)
INSERT INTO public.reserva (id, servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin,
                            duracion_minutos, estado, origen, calendar_token, precio, accepted_privacy_at)
VALUES ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001',
        'Fixture Antigua', 'fixture2@example.com', '600000002',
        (now() AT TIME ZONE 'Atlantic/Canary')::date - 40,
        '10:00', '11:00', 60, 'completada', 'manual', '00000000-0000-4000-8000-0000000000bb', 40, now());

-- Fila de auditoría ajena (para probar que no se puede modificar)
INSERT INTO public.audit_log (admin_id, accion, entidad, descripcion)
VALUES (current_setting('t.admin')::uuid, 'test', 'test', 'TEST 022');

-- ─────────────────────────────────────────────────────────────
-- ROL anon (web pública con la anon key)
-- ─────────────────────────────────────────────────────────────
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);

DO $test$
DECLARE
  v_id uuid;
  v_n int;
BEGIN
  -- Positivas
  INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin,
                              duracion_minutos, estado, precio, origen, accepted_privacy_at)
  VALUES ('00000000-0000-4000-8000-000000000001', 'Prueba Web', 'web@example.com', '600000001',
          current_setting('t.fecha')::date, '12:00', '13:00', 60, 'pendiente', 40, 'web', now());
  RAISE NOTICE 'OK A01 anon crea una solicitud válida (pendiente)';

  INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin,
                              duracion_minutos, estado, precio, origen, accepted_privacy_at)
  VALUES ('00000000-0000-4000-8000-000000000001', 'Prueba Medianoche', 'web2@example.com', '600000003',
          current_setting('t.fecha')::date, '23:00', '24:00', 60, 'pendiente', 40, 'web', now());
  RAISE NOTICE 'OK A02 anon crea una solicitud que termina a medianoche (24:00)';

  INSERT INTO public.cliente (nombre, email, telefono, origen)
  VALUES ('Cliente Prueba', 'cliente-test@example.com', '600000004', 'web')
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'FALLO A03: el INSERT … RETURNING de cliente no devolvió id'; END IF;
  RAISE NOTICE 'OK A03 anon crea cliente y recibe su id (RETURNING)';

  INSERT INTO public.contacto (nombre, email, asunto, mensaje, accepted_privacy_at)
  VALUES ('Contacto Prueba', 'contacto@example.com', 'Asunto', 'Mensaje de prueba', now());
  RAISE NOTICE 'OK A04 anon envía un mensaje de contacto válido';

  SELECT count(*) INTO v_n FROM public.reserva;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A05: anon ve % reservas', v_n; END IF;
  RAISE NOTICE 'OK A05 anon no puede leer reservas';

  -- En esta prueba todo es UNA transacción (now() constante), así que anon
  -- sigue viendo el cliente que acaba de insertar; ningún otro.
  SELECT count(*) INTO v_n FROM public.cliente WHERE email IS DISTINCT FROM 'cliente-test@example.com';
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A06: anon ve % clientes ajenos', v_n; END IF;
  RAISE NOTICE 'OK A06 anon no puede leer clientes ajenos';

  UPDATE public.reserva SET estado = 'cancelada' WHERE id = '00000000-0000-4000-8000-000000000010';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A07: anon modificó % reservas', v_n; END IF;
  RAISE NOTICE 'OK A07 anon no puede modificar reservas';

  SELECT count(*) INTO v_n FROM public.get_occupied_slots(current_setting('t.fecha')::date);
  IF v_n < 4 THEN RAISE EXCEPTION 'FALLO A08: get_occupied_slots devolvió % intervalos (esperados ≥4)', v_n; END IF;
  RAISE NOTICE 'OK A08 anon consulta la disponibilidad (solo horas)';

  SELECT count(*) INTO v_n FROM public.get_reserva_by_calendar_token('00000000-0000-4000-8000-0000000000aa');
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO A09: el token vigente devolvió % filas', v_n; END IF;
  RAISE NOTICE 'OK A09 el enlace .ics vigente funciona';

  SELECT count(*) INTO v_n FROM public.get_reserva_by_calendar_token('00000000-0000-4000-8000-0000000000bb');
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A10: un enlace .ics de hace 40 días sigue activo'; END IF;
  RAISE NOTICE 'OK A10 el enlace .ics caduca 30 días después de la sesión';

  SELECT count(*) INTO v_n FROM public.get_reserva_by_calendar_token(gen_random_uuid());
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A11: un token aleatorio devolvió datos'; END IF;
  RAISE NOTICE 'OK A11 un token inventado no devuelve nada';

  SELECT count(*) INTO v_n
  FROM information_schema.routines r
  JOIN information_schema.parameters p ON p.specific_name = r.specific_name
  WHERE r.routine_schema = 'public' AND r.routine_name = 'get_reserva_by_calendar_token'
    AND p.parameter_mode = 'OUT' AND p.parameter_name IN ('nombre','email','telefono');
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO A12: la RPC del .ics devuelve datos personales'; END IF;
  RAISE NOTICE 'OK A12 la RPC del .ics no devuelve datos personales';
END $test$;

-- Negativas de anon: cada sentencia debe fallar con el SQLSTATE indicado
DO $test$
DECLARE c record;
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('A20 anon no crea reservas confirmadas',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,'10:00','11:00',60,'confirmada',40,'web',now())$q$, '42501'),
    ('A21 anon no marca reservas como pagadas',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, estado_pago, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,'10:00','11:00',60,'pendiente','pagado',40,'web',now())$q$, '42501'),
    ('A22 anon no altera el precio',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,'10:00','11:00',60,'pendiente',0,'web',now())$q$, '42501'),
    ('A23 anon no bloquea la agenda con una duración inventada',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,'08:00','23:00',900,'pendiente',40,'web',now())$q$, '42501'),
    ('A24 anon no reserva en el pasado',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', (now() AT TIME ZONE 'Atlantic/Canary')::date - 1,'10:00','11:00',60,'pendiente',40,'web',now())$q$, '42501'),
    ('A25 anon no reserva sin aceptar la privacidad',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,'10:00','11:00',60,'pendiente',40,'web')$q$, '42501'),
    ('A26 anon no reserva con horas nulas',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date + 1,60,'pendiente',40,'web',now())$q$, '42501|23514'),
    ('A27 anon no reserva sobre un bloqueo manual (trigger)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date,'18:00','19:00',60,'pendiente',40,'web',now())$q$, '23P01'),
    ('A28 anon no se solapa con una reserva confirmada (EXCLUDE)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Ataque','a@example.com','600000010', current_setting('t.fecha')::date,'10:00','11:00',60,'pendiente',40,'web',now())$q$, '23P01'),
    ('A29 doble envío simultáneo del mismo hueco (EXCLUDE)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000001','Repetida','r@example.com','600000011', current_setting('t.fecha')::date,'12:00','13:00',60,'pendiente',40,'web',now())$q$, '23P01'),
    ('A30 anon no crea clientes con estadísticas falsas',
     $q$INSERT INTO public.cliente (nombre, email, origen, importe_total) VALUES ('Ataque','x1@example.com','web',999)$q$, '42501'),
    ('A31 anon no crea clientes con notas internas',
     $q$INSERT INTO public.cliente (nombre, email, origen, notas) VALUES ('Ataque','x2@example.com','web','VIP')$q$, '42501'),
    ('A32 anon no crea mensajes marcados como leídos',
     $q$INSERT INTO public.contacto (nombre, email, asunto, mensaje, leido, accepted_privacy_at) VALUES ('Ataque','c@example.com','A','Mensaje',true,now())$q$, '42501'),
    ('A33 anon no envía contacto sin aceptar la privacidad',
     $q$INSERT INTO public.contacto (nombre, email, asunto, mensaje) VALUES ('Ataque','c@example.com','A','Mensaje')$q$, '42501'),
    ('A34 anon no lee la lista de administradores',
     $q$SELECT count(*) FROM public.administrador$q$, '42501'),
    ('A35 anon no lee el registro de auditoría',
     $q$SELECT count(*) FROM public.audit_log$q$, '42501'),
    ('A36 anon no ejecuta private.is_admin()',
     $q$SELECT private.is_admin()$q$, '42501')
  ) AS v(label, q, code)
  LOOP
    BEGIN
      EXECUTE c.q;
      RAISE EXCEPTION 'se permitió';
    EXCEPTION WHEN OTHERS THEN
      -- c.code admite alternativas separadas por "|"
      IF SQLSTATE = ANY (string_to_array(c.code, '|')) THEN
        RAISE NOTICE 'OK %', c.label;
      ELSE
        RAISE EXCEPTION 'FALLO % → SQLSTATE % (%); se esperaba %', c.label, SQLSTATE, SQLERRM, c.code;
      END IF;
    END;
  END LOOP;
END $test$;

RESET ROLE;

-- ─────────────────────────────────────────────────────────────
-- ROL authenticated SIN estar en la lista (alguien que se registró)
-- ─────────────────────────────────────────────────────────────
SELECT set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.intruso'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $test$
DECLARE v_n int; v_b boolean;
BEGIN
  SELECT private.is_admin() INTO v_b;
  IF v_b THEN RAISE EXCEPTION 'FALLO N01: is_admin() es true para un usuario ajeno'; END IF;
  RAISE NOTICE 'OK N01 is_admin() = false para un usuario que no está en la lista';

  SELECT (SELECT count(*) FROM public.reserva) + (SELECT count(*) FROM public.cliente)
       + (SELECT count(*) FROM public.finanza_movimiento) + (SELECT count(*) FROM public.contacto)
       + (SELECT count(*) FROM public.administrador) + (SELECT count(*) FROM public.audit_log)
       + (SELECT count(*) FROM public.bloqueo_horario) + (SELECT count(*) FROM public.cliente_nota)
  INTO v_n;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO N02: un usuario ajeno ve % filas privadas', v_n; END IF;
  RAISE NOTICE 'OK N02 un usuario ajeno no ve reservas, clientes, finanzas, mensajes ni auditoría';

  UPDATE public.reserva SET estado = 'cancelada' WHERE id = '00000000-0000-4000-8000-000000000010';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO N03: un usuario ajeno modificó % reservas', v_n; END IF;
  DELETE FROM public.servicio WHERE id = '00000000-0000-4000-8000-000000000001';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO N03: un usuario ajeno borró servicios'; END IF;
  RAISE NOTICE 'OK N03 un usuario ajeno no modifica ni borra datos';
END $test$;

DO $test$
DECLARE c record;
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('N10 un usuario ajeno no se añade a la lista de administradores',
     $q$INSERT INTO public.administrador (id, email, nombre) VALUES (current_setting('t.intruso')::uuid, 'intruso@example.com', 'Intruso')$q$, '42501'),
    ('N11 un usuario ajeno no crea servicios',
     $q$INSERT INTO public.servicio (admin_id, nombre, descripcion, precio, duracion_minutos, categoria) VALUES (current_setting('t.admin')::uuid, 'X', 'X', 1, 60, 'Sonido')$q$, '42501'),
    ('N12 un usuario ajeno no escribe en la auditoría',
     $q$INSERT INTO public.audit_log (admin_id, accion, entidad) VALUES (current_setting('t.intruso')::uuid, 'x', 'x')$q$, '42501'),
    ('N13 un usuario ajeno no sube archivos a Storage',
     $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('galeria', 'test-022/intruso.png')$q$, '42501')
  ) AS v(label, q, code)
  LOOP
    BEGIN
      EXECUTE c.q;
      RAISE EXCEPTION 'se permitió';
    EXCEPTION WHEN OTHERS THEN
      -- c.code admite alternativas separadas por "|"
      IF SQLSTATE = ANY (string_to_array(c.code, '|')) THEN
        RAISE NOTICE 'OK %', c.label;
      ELSE
        RAISE EXCEPTION 'FALLO % → SQLSTATE % (%); se esperaba %', c.label, SQLSTATE, SQLERRM, c.code;
      END IF;
    END;
  END LOOP;
END $test$;

RESET ROLE;

-- ─────────────────────────────────────────────────────────────
-- ROL authenticated ADMINISTRADOR (está en la lista)
-- ─────────────────────────────────────────────────────────────
SELECT set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.admin'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $test$
DECLARE v_n int; v_b boolean;
BEGIN
  SELECT private.is_admin() INTO v_b;
  IF NOT v_b THEN RAISE EXCEPTION 'FALLO B01: is_admin() es false para el administrador'; END IF;
  RAISE NOTICE 'OK B01 is_admin() = true para el administrador';

  SELECT count(*) INTO v_n FROM public.reserva;
  IF v_n < 2 THEN RAISE EXCEPTION 'FALLO B02: el administrador solo ve % reservas', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.administrador;
  IF v_n < 1 THEN RAISE EXCEPTION 'FALLO B02: el administrador no ve la lista'; END IF;
  RAISE NOTICE 'OK B02 el administrador lee reservas y la lista';

  UPDATE public.reserva SET notas_admin = 'nota de prueba' WHERE id = '00000000-0000-4000-8000-000000000010';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO B03: el administrador no pudo editar la reserva'; END IF;
  RAISE NOTICE 'OK B03 el administrador edita reservas';

  -- Cambiar solo el estado NO pasa por el trigger de solapamientos
  UPDATE public.reserva SET estado = 'pendiente' WHERE id = '00000000-0000-4000-8000-000000000010';
  RAISE NOTICE 'OK B04 el administrador cambia el estado sin interferencias del trigger';

  INSERT INTO public.audit_log (admin_id, accion, entidad, descripcion)
  VALUES (current_setting('t.admin')::uuid, 'test', 'test', 'propia');
  RAISE NOTICE 'OK B05 el administrador registra auditoría a su nombre';

  UPDATE public.reserva SET hora_inicio = '15:00', hora_fin = '16:00' WHERE id = '00000000-0000-4000-8000-000000000010';
  RAISE NOTICE 'OK B06 el administrador mueve una reserva a un hueco libre';
END $test$;

DO $test$
DECLARE c record;
BEGIN
  FOR c IN SELECT * FROM (VALUES
    ('B10 el administrador no falsifica el autor de la auditoría',
     $q$INSERT INTO public.audit_log (admin_id, accion, entidad) VALUES (current_setting('t.intruso')::uuid, 'x', 'x')$q$, '42501'),
    ('B11 la auditoría no se puede modificar',
     $q$UPDATE public.audit_log SET descripcion = 'manipulada' WHERE descripcion = 'TEST 022'$q$, '42501'),
    ('B12 la auditoría no se puede borrar',
     $q$DELETE FROM public.audit_log WHERE descripcion = 'TEST 022'$q$, '42501'),
    ('B13 ni un administrador modifica la lista desde la API',
     $q$INSERT INTO public.administrador (id, email, nombre) VALUES (gen_random_uuid(), 'otro@example.com', 'Otro')$q$, '42501'),
    ('B14 el administrador no mueve una reserva sobre un bloqueo (trigger)',
     $q$UPDATE public.reserva SET hora_inicio = '18:30', hora_fin = '19:30' WHERE id = '00000000-0000-4000-8000-000000000010'$q$, '23P01'),
    ('B15 borrar un servicio con reservas está prohibido (FK RESTRICT)',
     $q$DELETE FROM public.servicio WHERE id = '00000000-0000-4000-8000-000000000001'$q$, '23001|23503'),  -- RESTRICT → 23001 (validado en PostgreSQL)
    ('B16 no se guarda una reserva activa con fin anterior al inicio',
     $q$UPDATE public.reserva SET hora_inicio = '16:00', hora_fin = '15:00' WHERE id = '00000000-0000-4000-8000-000000000010'$q$, '23514')
  ) AS v(label, q, code)
  LOOP
    BEGIN
      EXECUTE c.q;
      RAISE EXCEPTION 'se permitió';
    EXCEPTION WHEN OTHERS THEN
      -- c.code admite alternativas separadas por "|"
      IF SQLSTATE = ANY (string_to_array(c.code, '|')) THEN
        RAISE NOTICE 'OK %', c.label;
      ELSE
        RAISE EXCEPTION 'FALLO % → SQLSTATE % (%); se esperaba %', c.label, SQLSTATE, SQLERRM, c.code;
      END IF;
    END;
  END LOOP;
END $test$;

RESET ROLE;

-- ─────────────────────────────────────────────────────────────
-- REVOCACIÓN INMEDIATA: una cuenta baneada deja de ser administradora
-- ─────────────────────────────────────────────────────────────
UPDATE auth.users SET banned_until = now() + interval '1 day' WHERE id = current_setting('t.admin')::uuid;
SET LOCAL ROLE authenticated;

DO $test$
DECLARE v_b boolean; v_n int;
BEGIN
  SELECT private.is_admin() INTO v_b;
  IF v_b THEN RAISE EXCEPTION 'FALLO C01: una cuenta baneada sigue siendo administradora'; END IF;
  SELECT count(*) INTO v_n FROM public.reserva;
  IF v_n <> 0 THEN RAISE EXCEPTION 'FALLO C01: una cuenta baneada sigue viendo reservas'; END IF;
  RAISE NOTICE 'OK C01 banear la cuenta en Auth revoca el acceso al instante';
END $test$;

RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'TODAS LAS PRUEBAS 022/023 SUPERADAS'; END $$;

ROLLBACK;
