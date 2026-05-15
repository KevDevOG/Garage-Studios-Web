-- ============================================================
-- MIGRACIÓN 012: Estado de Pago en Reservas — Garage Studios
-- ============================================================

-- 1. Añadir columnas para control de pagos
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS importe_pagado NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pagado_at TIMESTAMPTZ;

-- 2. Añadir restricción CHECK para estado_pago
-- Primero eliminamos si ya existe por seguridad en re-ejecución
DO $$ 
BEGIN 
    ALTER TABLE public.reserva DROP CONSTRAINT IF EXISTS ck_reserva_estado_pago;
    ALTER TABLE public.reserva ADD CONSTRAINT ck_reserva_estado_pago 
    CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado'));
END $$;

-- 3. Índices para reportes financieros
CREATE INDEX IF NOT EXISTS idx_reserva_estado_pago ON public.reserva(estado_pago);
CREATE INDEX IF NOT EXISTS idx_reserva_pagado_at ON public.reserva(pagado_at);

-- 4. Permisos explícitos para el rol authenticated (Admin)
GRANT SELECT, UPDATE ON public.reserva TO authenticated;

-- Comentario descriptivo
COMMENT ON COLUMN public.reserva.estado_pago IS 'Estado económico de la reserva: pendiente, parcial o pagado.';
COMMENT ON COLUMN public.reserva.importe_pagado IS 'Cantidad total abonada por el cliente hasta el momento.';
COMMENT ON COLUMN public.reserva.pagado_at IS 'Fecha y hora en la que se marcó la reserva como totalmente pagada.';

-- 5. Trigger para actualizar pagado_at automáticamente si cambia a 'pagado'
CREATE OR REPLACE FUNCTION public.handle_reserva_pagado_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_pago = 'pagado' AND (OLD.estado_pago IS NULL OR OLD.estado_pago != 'pagado') THEN
        NEW.pagado_at := NOW();
    ELSIF NEW.estado_pago != 'pagado' THEN
        NEW.pagado_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reserva_pagado_at ON public.reserva;
CREATE TRIGGER trg_reserva_pagado_at
BEFORE UPDATE ON public.reserva
FOR EACH ROW
WHEN (OLD.estado_pago IS DISTINCT FROM NEW.estado_pago)
EXECUTE FUNCTION public.handle_reserva_pagado_at();
