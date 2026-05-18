-- ============================================================================
-- 016_visuals_storage_bucket.sql
-- ============================================================================
-- Creación del bucket "garage-visuals" en Supabase Storage
-- y configuración de políticas de seguridad.
-- ============================================================================

-- 1. Crear el bucket publico 'garage-visuals' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'garage-visuals', 
    'garage-visuals', 
    true, 
    5242880, -- 5 MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD EN storage.objects PARA EL BUCKET garage-visuals
-- ============================================================================

-- A. Permitir acceso público de lectura a los archivos del bucket 'garage-visuals'
CREATE POLICY "Public Read Access on garage-visuals"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'garage-visuals');

-- B. Permitir a usuarios autenticados subir archivos al bucket 'garage-visuals'
CREATE POLICY "Authenticated Upload Access on garage-visuals"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'garage-visuals');

-- C. Permitir a usuarios autenticados actualizar archivos en el bucket 'garage-visuals'
CREATE POLICY "Authenticated Update Access on garage-visuals"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'garage-visuals')
WITH CHECK (bucket_id = 'garage-visuals');

-- D. Permitir a usuarios autenticados eliminar archivos en el bucket 'garage-visuals'
CREATE POLICY "Authenticated Delete Access on garage-visuals"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'garage-visuals');
