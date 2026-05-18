-- ============================================================================
-- 018_visuals_categories_cleanup.sql
-- ============================================================================
-- Simplificar y normalizar las categorías de visuals_imagen a solo:
-- 'fotos', 'grabaciones', 'rodajes'
-- ============================================================================

-- 1. Eliminar la restricción CHECK antigua
ALTER TABLE public.visuals_imagen
DROP CONSTRAINT IF EXISTS visuals_imagen_tipo_check;

-- 2. Migrar los registros existentes a los 3 nuevos tipos limpios
UPDATE public.visuals_imagen
SET tipo = CASE
  WHEN tipo IN ('sesion', 'foto', 'otro') THEN 'fotos'
  WHEN tipo IN ('behind_the_scenes') THEN 'grabaciones'
  WHEN tipo IN ('rodaje', 'videoclip') THEN 'rodajes'
  WHEN tipo IN ('fotos', 'grabaciones', 'rodajes') THEN tipo
  ELSE 'fotos'
END;

-- 3. Cambiar el valor por defecto de la columna tipo
ALTER TABLE public.visuals_imagen
ALTER COLUMN tipo SET DEFAULT 'fotos';

-- 4. Añadir la restricción CHECK definitiva
ALTER TABLE public.visuals_imagen
ADD CONSTRAINT visuals_imagen_tipo_check
CHECK (tipo IN ('fotos', 'grabaciones', 'rodajes'));

-- ============================================================================
-- Comprobación final opcional:
-- ============================================================================
-- SELECT tipo, COUNT(*)
-- FROM public.visuals_imagen
-- GROUP BY tipo
-- ORDER BY tipo;
