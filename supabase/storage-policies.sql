-- Políticas de Storage para el bucket "galeria"
-- Ejecutar en Supabase SQL Editor

-- 1. Permitir a cualquiera LEER las imágenes (es un bucket público)
CREATE POLICY "Acceso público de lectura a galeria"
ON storage.objects FOR SELECT
USING (bucket_id = 'galeria');

-- 2. Permitir a usuarios autenticados SUBIR imágenes
CREATE POLICY "Usuarios autenticados pueden subir a galeria"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'galeria'
  AND auth.role() = 'authenticated'
);

-- 3. Permitir a usuarios autenticados ELIMINAR imágenes
CREATE POLICY "Usuarios autenticados pueden eliminar de galeria"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'galeria'
  AND auth.role() = 'authenticated'
);
