-- ============================================================
-- MIGRACIÓN 024: Las escrituras públicas solo desde el servidor
-- Garage Studios — cierre de seguridad (noviembre 2026)
-- ============================================================
-- ESTADO: PROPUESTA. NO aplicada en producción.
--
-- PROBLEMA: la anon key es pública (va en el navegador). Mientras el rol
-- anon pueda insertar en reserva/cliente/contacto, cualquiera puede llamar a
-- PostgREST directamente y saltarse Turnstile, el rate limit y la cuota por
-- contacto, que viven en las Server Actions.
--
-- SOLUCIÓN: las Server Actions escriben con la clave de servicio
-- (createPublicWriteClient) y aquí se retira al rol anon todo permiso sobre
-- las tablas privadas. anon conserva solo la lectura pública (servicios
-- activos, galería, visuals) y las RPC de disponibilidad y .ics.
--
-- REQUISITOS, EN ESTE ORDEN (si no, la web deja de aceptar reservas):
--   1. SUPABASE_SERVICE_ROLE_KEY configurada en Vercel (Production y Preview).
--   2. Desplegado el código de esta rama (createPublicWriteClient).
--   3. Aplicadas 023 y 022.
--   4. Entonces, esta 024.
-- Rollback: supabase/rollback/024_rollback.sql
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "reserva_public_insert" ON public.reserva;
DROP POLICY IF EXISTS "contacto_public_insert" ON public.contacto;
DROP POLICY IF EXISTS "cliente_public_insert" ON public.cliente;
DROP POLICY IF EXISTS "cliente_anon_select_on_insert" ON public.cliente;

REVOKE ALL ON
  public.reserva, public.cliente, public.contacto, public.cliente_nota,
  public.finanza_movimiento, public.bloqueo_horario, public.reserva_bloque,
  public.audit_log, public.administrador
FROM anon;

-- Lectura pública que sí necesita la web (las políticas ya la limitan)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.servicio, public.imagen, public.visuals_imagen FROM anon;

-- Postflight: anon no puede escribir en ninguna tabla de public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname, p.priv
    FROM pg_class c
    CROSS JOIN unnest(ARRAY['INSERT','UPDATE','DELETE']) AS p(priv)
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p')
      AND has_table_privilege('anon', c.oid, p.priv)
  LOOP
    RAISE EXCEPTION '024: anon conserva % sobre public.%', r.priv, r.relname;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND 'anon' = ANY (roles) AND cmd <> 'SELECT') THEN
    RAISE EXCEPTION '024: queda una política de escritura para anon';
  END IF;
END $$;

COMMIT;
