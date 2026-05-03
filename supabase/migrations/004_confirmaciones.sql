-- ============================================================
-- MIGRACIÓN 004: Confirmaciones de Reserva — Garage Studios
-- Ejecutar en Supabase SQL Editor
-- NO borra datos existentes
-- ============================================================

-- Añadir campos para seguimiento de confirmaciones
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS confirmacion_email_enviada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmacion_whatsapp_enviada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmacion_error TEXT;

-- Índices (opcionales, útiles si queremos filtrar qué no se ha enviado)
CREATE INDEX IF NOT EXISTS idx_reserva_conf_email ON public.reserva(confirmacion_email_enviada_at);
CREATE INDEX IF NOT EXISTS idx_reserva_conf_whatsapp ON public.reserva(confirmacion_whatsapp_enviada_at);

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir):
--
-- ALTER TABLE public.reserva 
--   DROP COLUMN IF EXISTS confirmacion_email_enviada_at,
--   DROP COLUMN IF EXISTS confirmacion_whatsapp_enviada_at,
--   DROP COLUMN IF EXISTS confirmacion_error;
-- DROP INDEX IF EXISTS idx_reserva_conf_email;
-- DROP INDEX IF EXISTS idx_reserva_conf_whatsapp;
-- ============================================================
