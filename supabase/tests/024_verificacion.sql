-- ============================================================
-- PRUEBAS DE LA MIGRACIÓN 024 (escrituras públicas solo desde el servidor)
-- ============================================================
-- DÓNDE: solo en staging/rama o en la validación local con PGlite, DESPUÉS
-- de 023, 022 y 024. Todo se deshace con el ROLLBACK final.
-- Resultado esperado: "TODAS LAS PRUEBAS 024 SUPERADAS".
-- ============================================================

BEGIN;

SELECT set_config('t.admin', (
  SELECT a.id::text FROM public.administrador a JOIN auth.users u ON u.id = a.id
  WHERE u.deleted_at IS NULL LIMIT 1), true);
SELECT set_config('t.fecha', ((now() AT TIME ZONE 'Atlantic/Canary')::date + 301)::text, true);

INSERT INTO public.servicio (id, admin_id, nombre, descripcion, precio, duracion_minutos, activo, categoria)
VALUES ('00000000-0000-4000-8000-000000000024', current_setting('t.admin')::uuid, 'TEST 024', 'fixture', 40, 60, true, 'Sonido');
INSERT INTO public.bloqueo_horario (fecha, hora_inicio, hora_fin, motivo)
VALUES (current_setting('t.fecha')::date, '18:00', '20:00', 'TEST 024');

-- ── anon: ya no puede escribir ni leer datos privados ──
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);

DO $test$
DECLARE c record; v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM public.servicio WHERE id = '00000000-0000-4000-8000-000000000024';
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO D01: anon no ve los servicios activos'; END IF;
  RAISE NOTICE 'OK D01 anon sigue leyendo el catálogo público';

  SELECT count(*) INTO v_n FROM public.get_occupied_slots(current_setting('t.fecha')::date);
  IF v_n < 1 THEN RAISE EXCEPTION 'FALLO D02: la disponibilidad pública no funciona'; END IF;
  RAISE NOTICE 'OK D02 anon sigue consultando la disponibilidad';

  FOR c IN SELECT * FROM (VALUES
    ('D10 anon no inserta reservas aunque sean válidas',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000024','Bot','b@example.com','600000020', current_setting('t.fecha')::date,'10:00','11:00',60,'pendiente',40,'web',now())$q$, '42501'),
    ('D11 anon no inserta mensajes de contacto',
     $q$INSERT INTO public.contacto (nombre, email, asunto, mensaje, accepted_privacy_at) VALUES ('Bot','b@example.com','A','Mensaje',now())$q$, '42501'),
    ('D12 anon no inserta clientes',
     $q$INSERT INTO public.cliente (nombre, email, origen) VALUES ('Bot','b2@example.com','web')$q$, '42501'),
    ('D13 anon no lee reservas',
     $q$SELECT count(*) FROM public.reserva$q$, '42501'),
    ('D14 anon no modifica servicios',
     $q$UPDATE public.servicio SET precio = 0$q$, '42501')
  ) AS v(label, q, code)
  LOOP
    BEGIN
      EXECUTE c.q;
      RAISE EXCEPTION 'se permitió';
    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE = ANY (string_to_array(c.code, '|')) THEN
        RAISE NOTICE 'OK %', c.label;
      ELSE
        RAISE EXCEPTION 'FALLO % → SQLSTATE % (%); se esperaba %', c.label, SQLSTATE, SQLERRM, c.code;
      END IF;
    END;
  END LOOP;
END $test$;

RESET ROLE;

-- ── service_role (Server Actions): escribe, pero la BD sigue protegiendo la agenda ──
SET LOCAL ROLE service_role;

DO $test$
DECLARE c record; v_id uuid;
BEGIN
  INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
  VALUES ('00000000-0000-4000-8000-000000000024','Cliente Web','web24@example.com','600000021', current_setting('t.fecha')::date,'10:00','11:00',60,'pendiente',40,'web',now());
  RAISE NOTICE 'OK D20 el servidor crea una solicitud válida';

  INSERT INTO public.cliente (nombre, email, telefono, origen) VALUES ('Cliente Web','web24@example.com','600000021','web')
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'FALLO D21: no se devolvió el id del cliente'; END IF;
  RAISE NOTICE 'OK D21 el servidor crea el cliente y recibe su id';

  INSERT INTO public.contacto (nombre, email, asunto, mensaje, accepted_privacy_at) VALUES ('Cliente Web','web24@example.com','Asunto','Mensaje de prueba',now());
  RAISE NOTICE 'OK D22 el servidor guarda mensajes de contacto';

  FOR c IN SELECT * FROM (VALUES
    ('D30 el servidor tampoco puede reservar sobre un bloqueo (trigger)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000024','X','x@example.com','600000022', current_setting('t.fecha')::date,'18:00','19:00',60,'pendiente',40,'web',now())$q$, '23P01'),
    ('D31 dos solicitudes al mismo hueco: la segunda falla (EXCLUDE)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000024','X','x@example.com','600000022', current_setting('t.fecha')::date,'10:00','11:00',60,'pendiente',40,'web',now())$q$, '23P01'),
    ('D32 horas invertidas rechazadas (CHECK)',
     $q$INSERT INTO public.reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, precio, origen, accepted_privacy_at)
        VALUES ('00000000-0000-4000-8000-000000000024','X','x@example.com','600000022', current_setting('t.fecha')::date,'14:00','13:00',60,'pendiente',40,'web',now())$q$, '23514')
  ) AS v(label, q, code)
  LOOP
    BEGIN
      EXECUTE c.q;
      RAISE EXCEPTION 'se permitió';
    EXCEPTION WHEN OTHERS THEN
      IF SQLSTATE = ANY (string_to_array(c.code, '|')) THEN
        RAISE NOTICE 'OK %', c.label;
      ELSE
        RAISE EXCEPTION 'FALLO % → SQLSTATE % (%); se esperaba %', c.label, SQLSTATE, SQLERRM, c.code;
      END IF;
    END;
  END LOOP;
END $test$;

RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'TODAS LAS PRUEBAS 024 SUPERADAS'; END $$;

ROLLBACK;
