-- ============================================================
-- MIGRACIÓN 007: Finanzas — Garage Studios
-- Ejecutar en Supabase SQL Editor
-- NO borra datos existentes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.finanza_movimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    categoria TEXT NOT NULL,
    concepto TEXT NOT NULL,
    descripcion TEXT,
    importe NUMERIC(10,2) NOT NULL CHECK (importe > 0),
    fecha DATE NOT NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'bizum', 'otro') OR metodo_pago IS NULL),
    reserva_id UUID REFERENCES public.reserva(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.cliente(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES public.servicio(id) ON DELETE SET NULL,
    recurrente BOOLEAN DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_finanza_fecha ON public.finanza_movimiento(fecha);
CREATE INDEX IF NOT EXISTS idx_finanza_tipo ON public.finanza_movimiento(tipo);
CREATE INDEX IF NOT EXISTS idx_finanza_categoria ON public.finanza_movimiento(categoria);
CREATE INDEX IF NOT EXISTS idx_finanza_deleted_at ON public.finanza_movimiento(deleted_at);
CREATE INDEX IF NOT EXISTS idx_finanza_reserva_id ON public.finanza_movimiento(reserva_id);
CREATE INDEX IF NOT EXISTS idx_finanza_cliente_id ON public.finanza_movimiento(cliente_id);

-- Trigger para updated_at (reutiliza el de reserva o usa uno simple si existe, en Supabase se puede dejar así o añadir función genérica)
-- Si ya existe un trigger generic_update_updated_at_column en la BD:
-- CREATE TRIGGER trg_finanza_movimiento_updated_at
-- BEFORE UPDATE ON public.finanza_movimiento
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir):
--
-- DROP TABLE IF EXISTS public.finanza_movimiento;
-- ============================================================
