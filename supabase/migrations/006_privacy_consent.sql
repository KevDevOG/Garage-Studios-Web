-- Añadir campos de consentimiento de privacidad a las tablas contacto y reserva
ALTER TABLE contacto ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ;
ALTER TABLE reserva ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ;

-- Comentario para documentación
COMMENT ON COLUMN contacto.accepted_privacy_at IS 'Timestamp de cuando el usuario aceptó la política de privacidad';
COMMENT ON COLUMN reserva.accepted_privacy_at IS 'Timestamp de cuando el usuario aceptó la política de privacidad';
