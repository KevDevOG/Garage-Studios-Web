-- ============================================================
-- 010_reservation_status_emails.sql
-- Añadir campos para trazabilidad de emails de cancelación y completado
-- ============================================================

ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS cancelacion_email_enviada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completada_email_enviada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_estado_error TEXT;

COMMENT ON COLUMN public.reserva.cancelacion_email_enviada_at IS 'Fecha y hora en la que se envió el email de cancelación automático.';
COMMENT ON COLUMN public.reserva.completada_email_enviada_at IS 'Fecha y hora en la que se envió el email de completada automático.';
COMMENT ON COLUMN public.reserva.email_estado_error IS 'Registro de error en caso de que falle el envío de email de cancelación o completado.';
