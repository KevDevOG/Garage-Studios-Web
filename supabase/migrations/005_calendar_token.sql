-- ============================================================
-- MIGRACIÓN 005: Tokens de Calendario — Garage Studios
-- Ejecutar en Supabase SQL Editor
-- NO borra datos existentes
-- ============================================================

-- Añadir el campo para el token del calendario
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS calendar_token UUID;

-- Rellenar los tokens para las reservas existentes que no lo tengan
UPDATE public.reserva
SET calendar_token = uuid_generate_v4()
WHERE calendar_token IS NULL;

-- Ahora que todos tienen token, asegurar que sea único y por defecto se genere automáticamente
ALTER TABLE public.reserva
ALTER COLUMN calendar_token SET DEFAULT uuid_generate_v4();

-- Crear un índice único para búsquedas rápidas por token
CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_calendar_token ON public.reserva(calendar_token);

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir):
--
-- ALTER TABLE public.reserva DROP COLUMN IF EXISTS calendar_token;
-- DROP INDEX IF EXISTS idx_reserva_calendar_token;
-- ============================================================
