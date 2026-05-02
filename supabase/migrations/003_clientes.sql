-- ============================================================
-- MIGRACIÓN 003: Sistema de Clientes — Garage Studios
-- Ejecutar en Supabase SQL Editor
-- NO borra datos existentes
-- ============================================================

-- 1. Crear tabla cliente
CREATE TABLE IF NOT EXISTS public.cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Datos básicos
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  instagram TEXT,

  -- Datos internos
  notas TEXT,
  origen TEXT DEFAULT 'web'
    CHECK (origen IN ('web', 'manual', 'instagram', 'whatsapp', 'referido', 'otro')),
  estado TEXT DEFAULT 'activo'
    CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),

  -- Estadísticas (recalculadas desde reservas)
  total_reservas INTEGER DEFAULT 0,
  reservas_confirmadas INTEGER DEFAULT 0,
  reservas_canceladas INTEGER DEFAULT 0,
  reservas_completadas INTEGER DEFAULT 0,
  ultima_reserva_at TIMESTAMPTZ,
  ultima_reserva_fecha DATE,
  servicio_favorito_id UUID REFERENCES public.servicio(id) ON DELETE SET NULL,
  importe_total NUMERIC(10,2) DEFAULT 0,

  -- Fechas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restricciones UNIQUE condicionales (solo si no null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_email_unique
  ON public.cliente(email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_telefono_unique
  ON public.cliente(telefono)
  WHERE telefono IS NOT NULL;

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_cliente_estado ON public.cliente(estado);
CREATE INDEX IF NOT EXISTS idx_cliente_origen ON public.cliente(origen);
CREATE INDEX IF NOT EXISTS idx_cliente_ultima_reserva ON public.cliente(ultima_reserva_at);

-- 4. Añadir cliente_id a la tabla reserva (nullable para reservas antiguas)
ALTER TABLE public.reserva
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.cliente(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reserva_cliente ON public.reserva(cliente_id);

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir):
--
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS cliente_id;
-- DROP INDEX IF EXISTS idx_reserva_cliente;
-- DROP INDEX IF EXISTS idx_cliente_email_unique;
-- DROP INDEX IF EXISTS idx_cliente_telefono_unique;
-- DROP INDEX IF EXISTS idx_cliente_estado;
-- DROP INDEX IF EXISTS idx_cliente_origen;
-- DROP INDEX IF EXISTS idx_cliente_ultima_reserva;
-- DROP TABLE IF EXISTS public.cliente;
-- ============================================================
