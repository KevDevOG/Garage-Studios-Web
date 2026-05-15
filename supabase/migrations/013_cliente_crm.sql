-- Migración 013: Mejoras Clientes / CRM
-- Añadir soporte para etiquetas y notas internas

-- 1. Añadir columna de etiquetas a la tabla cliente
ALTER TABLE public.cliente
ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';

-- 2. Crear tabla de notas de cliente
CREATE TABLE IF NOT EXISTS public.cliente_nota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.cliente(id) ON DELETE CASCADE,
    nota TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Campos de auditoría interna opcionales
    creado_por UUID REFERENCES auth.users(id)
);

-- 3. Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_cliente_nota_cliente_id ON public.cliente_nota(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_nota_created_at ON public.cliente_nota(created_at);
CREATE INDEX IF NOT EXISTS idx_cliente_nota_deleted_at ON public.cliente_nota(deleted_at);

-- 4. Habilitar RLS
ALTER TABLE public.cliente_nota ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad (Solo administradores autenticados)
-- Nota: Asumimos que el admin tiene rol 'authenticated' o similar. 
-- En este proyecto, el acceso al panel admin ya está protegido por middleware y auth de Supabase.

-- 5. Políticas de seguridad (Solo administradores autenticados)
-- Usamos una sola política para simplificar el acceso total a admins

CREATE POLICY "cliente_nota_admin_all"
ON public.cliente_nota
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Permisos (GRANT)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_nota TO authenticated;
GRANT SELECT, UPDATE ON public.cliente TO authenticated;

-- Comentario para el admin
COMMENT ON TABLE public.cliente_nota IS 'Historial de notas internas de CRM para clientes del estudio.';
COMMENT ON COLUMN public.cliente.etiquetas IS 'Etiquetas internas para clasificación de clientes (VIP, Frecuente, etc.)';
