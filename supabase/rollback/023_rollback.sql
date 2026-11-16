-- ============================================================
-- ROLLBACK DE LA MIGRACIÓN 023 (transaccional)
-- ============================================================
-- ⚠️  Reabre la vulnerabilidad: vuelve a dar acceso total a CUALQUIER usuario
-- autenticado. Ejecútalo solo si la 023 deja el panel inutilizable y SOLO
-- con el registro público de Supabase Auth desactivado.
--
-- Restaura un estado funcionalmente idéntico al anterior: una política
-- `TO authenticated USING (true)` por tabla (las políticas duplicadas que
-- había en cliente_nota y bloqueo_horario eran redundantes con esta).
-- ============================================================

BEGIN;

-- 3. Tablas del panel
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'bloqueo_horario','cliente','cliente_nota','contacto','finanza_movimiento',
    'imagen','reserva','reserva_bloque','servicio','visuals_imagen'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
  END LOOP;
END $$;

CREATE POLICY "bloqueo_admin_all" ON public.bloqueo_horario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cliente_admin_all" ON public.cliente FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cliente_nota_admin_all" ON public.cliente_nota FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "contacto_admin_all" ON public.contacto FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "finanza_admin_all" ON public.finanza_movimiento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "imagen_admin_all" ON public.imagen FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reserva_admin_all" ON public.reserva FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bloque_admin_all" ON public.reserva_bloque FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "servicio_admin_all" ON public.servicio FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Administradores tienen acceso total a visuals_imagen" ON public.visuals_imagen
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Lista de administradores
DROP POLICY IF EXISTS "administrador_admin_select" ON public.administrador;
CREATE POLICY "admin_authenticated_all" ON public.administrador FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.administrador TO anon, authenticated;

-- 4. Auditoría
DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_insert" ON public.audit_log;
CREATE POLICY "audit_admin_all" ON public.audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.audit_log TO anon, authenticated;

-- 5. Storage
DROP POLICY IF EXISTS "admin_insert_media" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir a galeria" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'galeria' AND auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden eliminar de galeria" ON storage.objects
  FOR DELETE USING (bucket_id = 'galeria' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Upload Access on garage-visuals" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'garage-visuals');
CREATE POLICY "Authenticated Update Access on garage-visuals" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'garage-visuals') WITH CHECK (bucket_id = 'garage-visuals');
CREATE POLICY "Authenticated Delete Access on garage-visuals" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'garage-visuals');
UPDATE storage.buckets SET file_size_limit = NULL, allowed_mime_types = NULL WHERE id = 'galeria';

-- 1. Función y esquema privados
DROP FUNCTION IF EXISTS private.is_admin();
DROP SCHEMA IF EXISTS private;  -- falla (y revierte todo) si contiene otros objetos: revisar antes

COMMIT;
