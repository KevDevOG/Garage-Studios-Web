-- ============================================================
-- MIGRACIÓN: Sistema de Calendario y Reservas — Garage Studios
-- Ejecutar en Supabase SQL Editor
-- NO borra datos existentes
-- ============================================================

-- 1. Eliminar CHECK constraint antiguo de estado (solo tiene 3 valores)
ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS reserva_estado_check;

-- 2. Añadir nuevos campos a la tabla reserva
--    hora_inicio/hora_fin NULLables para no romper reservas antiguas
ALTER TABLE public.reserva
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fin TIME,
  ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER,
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS notas_admin TEXT,
  ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,  -- TODO: futura integración Apple Calendar (.ics)
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Nuevo CHECK constraint con estados ampliados
ALTER TABLE public.reserva
  ADD CONSTRAINT reserva_estado_check
  CHECK (estado IN ('pendiente','confirmada','cancelada','rechazada','completada'));

-- 4. Tabla de bloques para packs y sesiones divididas
CREATE TABLE IF NOT EXISTS public.reserva_bloque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserva_id UUID NOT NULL REFERENCES public.reserva(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  orden INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','confirmada','cancelada','rechazada','completada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices para rendimiento en consultas de disponibilidad
CREATE INDEX IF NOT EXISTS idx_reserva_fecha ON public.reserva(fecha_reserva);
CREATE INDEX IF NOT EXISTS idx_reserva_estado ON public.reserva(estado);
CREATE INDEX IF NOT EXISTS idx_reserva_deleted ON public.reserva(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bloque_reserva ON public.reserva_bloque(reserva_id);
CREATE INDEX IF NOT EXISTS idx_bloque_fecha ON public.reserva_bloque(fecha);

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir los cambios):
--
-- DROP TABLE IF EXISTS public.reserva_bloque;
-- DROP INDEX IF EXISTS idx_reserva_fecha;
-- DROP INDEX IF EXISTS idx_reserva_estado;
-- DROP INDEX IF EXISTS idx_reserva_deleted;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS hora_inicio;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS hora_fin;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS duracion_minutos;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS origen;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS notas_admin;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS calendar_event_id;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS reserva_estado_check;
-- ALTER TABLE public.reserva ADD CONSTRAINT reserva_estado_check
--   CHECK (estado IN ('pendiente','confirmada','cancelada'));
-- ============================================================
