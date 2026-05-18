-- ============================================================================
-- 017_alter_visuals_imagen_titulo_nullable.sql
-- Permite que la columna 'titulo' de public.visuals_imagen sea nullable
-- para que las imágenes puedan no tener ningún título asignado.
-- ============================================================================

ALTER TABLE public.visuals_imagen
ALTER COLUMN titulo DROP NOT NULL;
