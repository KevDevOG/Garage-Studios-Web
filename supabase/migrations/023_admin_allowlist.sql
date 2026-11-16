-- ============================================================
-- MIGRACIÓN 023: Lista privada de administradores (allowlist) en RLS
-- Garage Studios — cierre de pendientes de seguridad (noviembre 2026)
-- ============================================================
-- ESTADO: PROPUESTA. NO se ha aplicado en producción. Aplicar primero en una
-- rama/staging y ejecutar supabase/tests/022_023_verificacion.sql.
-- Procedimiento completo y rollback: docs/migraciones-022-023.md
--
-- PROBLEMA (medido el 16-nov-2026 en el proyecto de producción):
--  * El registro público de Supabase Auth está ABIERTO (disable_signup=false).
--  * Todas las políticas del panel son `TO authenticated USING (true)`.
--  * Resultado: cualquiera que se registre con un email propio y lo confirme
--    obtiene lectura/escritura total (reservas, clientes, finanzas, Storage)
--    y puede incluso insertarse en `administrador`.
--
-- SOLUCIÓN:
--  * `public.administrador` es la lista privada: un usuario es administrador
--    solo si su auth.users.id está en ella. Sin políticas de escritura: se
--    gestiona exclusivamente desde el SQL Editor o con la clave de servicio.
--  * `private.is_admin()` (esquema NO expuesto por la API) lo comprueba y
--    exige además que la cuenta exista, no esté baneada ni sea anónima.
--    Banear o borrar la cuenta en Auth revoca el acceso al instante.
--  * Todas las políticas `TO authenticated` pasan a exigir is_admin().
--  * audit_log: inmutable (solo SELECT e INSERT) y el admin_id no se puede
--    falsificar.
--  * Comprobación final: ninguna política para `authenticated` (o que use
--    auth.role()) queda sin is_admin().
--
-- La medida inmediata, ANTES incluso de esta migración, es desactivar el
-- registro: Authentication → Sign In / Providers → "Allow new users to sign up".
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. PREFLIGHT: no dejar el panel sin ningún administrador válido
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.administrador a
    JOIN auth.users u ON u.id = a.id
    WHERE u.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION '023: ningún registro de administrador corresponde a una cuenta de Auth; se bloquearía el panel';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 1. FUNCIÓN private.is_admin()
-- ─────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administrador a
    JOIN auth.users u ON u.id = a.id
    WHERE a.id = (SELECT auth.uid())
      AND u.deleted_at IS NULL
      AND u.is_anonymous IS NOT TRUE
      AND (u.banned_until IS NULL OR u.banned_until <= now())
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. LA LISTA EN SÍ: public.administrador
-- ─────────────────────────────────────────────────────────────
-- Solo un administrador puede leerla; nadie puede escribirla vía API.
REVOKE ALL ON public.administrador FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.administrador FROM authenticated;

DROP POLICY IF EXISTS "admin_authenticated_all" ON public.administrador;
DROP POLICY IF EXISTS "administrador_admin_select" ON public.administrador;
CREATE POLICY "administrador_admin_select" ON public.administrador
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 3. TABLAS DEL PANEL: acceso total solo para administradores
-- ─────────────────────────────────────────────────────────────
-- Se eliminan TODAS las políticas existentes para `authenticated` (incluidas
-- las duplicadas de cliente_nota y bloqueo_horario) y se crea una única
-- política por tabla.
DO $$
DECLARE
  r record;
  t text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'bloqueo_horario','cliente','cliente_nota','contacto','finanza_movimiento',
        'imagen','reserva','reserva_bloque','servicio','visuals_imagen'
      )
      AND (
        'authenticated' = ANY (roles)
        OR qual ILIKE '%auth.role()%' OR with_check ILIKE '%auth.role()%'
        OR qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'bloqueo_horario','cliente','cliente_nota','contacto','finanza_movimiento',
    'imagen','reserva','reserva_bloque','servicio','visuals_imagen'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
      'USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()))',
      t || '_admin_all', t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. AUDIT_LOG: inmutable y sin suplantación
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_insert" ON public.audit_log;
CREATE POLICY "audit_admin_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
CREATE POLICY "audit_admin_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()) AND admin_id = (SELECT auth.uid()));
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM authenticated;
REVOKE ALL ON public.audit_log FROM anon;

-- ─────────────────────────────────────────────────────────────
-- 5. STORAGE: subir, cambiar y borrar archivos solo administradores
-- ─────────────────────────────────────────────────────────────
-- La lectura pública de los buckets 'galeria' y 'garage-visuals' no cambia.
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir a galeria" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar de galeria" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access on garage-visuals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access on garage-visuals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access on garage-visuals" ON storage.objects;
DROP POLICY IF EXISTS "admin_insert_media" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;

CREATE POLICY "admin_insert_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('galeria','garage-visuals') AND (SELECT private.is_admin()));
CREATE POLICY "admin_update_media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('galeria','garage-visuals') AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id IN ('galeria','garage-visuals') AND (SELECT private.is_admin()));
CREATE POLICY "admin_delete_media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('galeria','garage-visuals') AND (SELECT private.is_admin()));

-- El bucket 'galeria' no tenía límites: mismos que la app (5 MB, imágenes).
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'galeria';

-- ─────────────────────────────────────────────────────────────
-- 6. POSTFLIGHT: ninguna política de usuario autenticado sin is_admin()
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public','storage')
      AND (
        'authenticated' = ANY (roles)
        OR qual ILIKE '%auth.role()%' OR with_check ILIKE '%auth.role()%'
      )
      AND coalesce(qual, '') NOT ILIKE '%is_admin()%'
      AND coalesce(with_check, '') NOT ILIKE '%is_admin()%'
  LOOP
    RAISE EXCEPTION '023: la política %.%."%" no exige is_admin()', r.schemaname, r.tablename, r.policyname;
  END LOOP;

  -- Ninguna política de ESCRITURA en Storage (para cualquier rol) sin is_admin()
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND coalesce(qual, '') NOT ILIKE '%is_admin()%'
      AND coalesce(with_check, '') NOT ILIKE '%is_admin()%'
  LOOP
    RAISE EXCEPTION '023: la política de escritura storage.objects."%" no exige is_admin()', r.policyname;
  END LOOP;

  -- Ninguna política de anon/public en public salvo lectura o las INSERT públicas conocidas
  FOR r IN
    SELECT tablename, policyname, cmd FROM pg_policies
    WHERE schemaname = 'public'
      AND (roles && ARRAY['anon','public']::name[])
      AND NOT (cmd = 'SELECT'
               OR (cmd = 'INSERT' AND tablename IN ('reserva','cliente','contacto')))
  LOOP
    RAISE EXCEPTION '023: política inesperada para anon/public: %."%" (%)', r.tablename, r.policyname, r.cmd;
  END LOOP;

  -- Toda tabla de public con RLS activado
  FOR r IN
    SELECT c.relname FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p')
      AND NOT c.relrowsecurity
  LOOP
    RAISE EXCEPTION '023: la tabla public.% no tiene RLS activado', r.relname;
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- ALTA / BAJA DE ADMINISTRADORES (SQL Editor de Supabase, nunca desde la web)
--   1. Crear la cuenta en Authentication → Users → "Add user" (con el
--      registro público desactivado es la única vía).
--   2. INSERT INTO public.administrador (id, email, nombre)
--      SELECT id, email, 'Nombre' FROM auth.users WHERE email = 'persona@dominio';
--   Baja inmediata: banear o borrar la cuenta en Auth, o
--      DELETE FROM public.administrador WHERE email = 'persona@dominio';
--      (si tiene servicios/imágenes a su nombre, reasignarlos antes: FK RESTRICT)
--
-- ROLLBACK: supabase/rollback/023_rollback.sql (transaccional).
-- ============================================================
