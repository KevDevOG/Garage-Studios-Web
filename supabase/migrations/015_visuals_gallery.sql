-- ============================================================================
-- 015_visuals_gallery.sql
-- ============================================================================
-- Tabla para independizar la galería de la submarca "Garage Visuals"
-- de la galería principal de Garage Studios.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visuals_imagen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    url_imagen TEXT NOT NULL,
    tipo TEXT DEFAULT 'foto' CHECK (tipo IN ('foto', 'rodaje', 'videoclip', 'sesion', 'behind_the_scenes', 'otro')),
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 999,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_visuals_imagen_activo ON public.visuals_imagen(activo);
CREATE INDEX IF NOT EXISTS idx_visuals_imagen_destacado ON public.visuals_imagen(destacado);
CREATE INDEX IF NOT EXISTS idx_visuals_imagen_orden ON public.visuals_imagen(orden);
CREATE INDEX IF NOT EXISTS idx_visuals_imagen_deleted_at ON public.visuals_imagen(deleted_at);
CREATE INDEX IF NOT EXISTS idx_visuals_imagen_created_at ON public.visuals_imagen(created_at);

-- ============================================================================
-- HABILITAR RLS (ROW LEVEL SECURITY)
-- ============================================================================
ALTER TABLE public.visuals_imagen ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD
-- ============================================================================

-- 1. Público: Solo puede leer imágenes activas y que no estén borradas lógicamente
CREATE POLICY "Público puede ver imágenes activas de visuals"
    ON public.visuals_imagen
    FOR SELECT
    TO public
    USING (activo = true AND deleted_at IS NULL);

-- 2. Administradores (Autenticados): Tienen acceso total a todo
CREATE POLICY "Administradores tienen acceso total a visuals_imagen"
    ON public.visuals_imagen
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PERMISOS
-- ============================================================================
GRANT ALL ON TABLE public.visuals_imagen TO authenticated;
GRANT SELECT ON TABLE public.visuals_imagen TO anon;
GRANT SELECT ON TABLE public.visuals_imagen TO public;
