-- Tabla para bloqueos manuales de horario por parte del administrador
CREATE TABLE IF NOT EXISTS public.bloqueo_horario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bloqueo_horario_fecha ON public.bloqueo_horario(fecha);
CREATE INDEX IF NOT EXISTS idx_bloqueo_horario_deleted ON public.bloqueo_horario(deleted_at);

-- Habilitar RLS
ALTER TABLE public.bloqueo_horario ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (Simplificadas para Admin)
CREATE POLICY "bloqueo_admin_all"
ON public.bloqueo_horario
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permisos explícitos para el rol authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bloqueo_horario TO authenticated;

-- Comentario descriptivo
COMMENT ON TABLE public.bloqueo_horario IS 'Bloqueos manuales de horario que afectan a la disponibilidad pública y operativa diaria.';
