-- Migración para añadir el campo precio a la tabla reserva
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS precio NUMERIC(10,2);

-- Actualizar registros existentes con el precio del servicio asociado (opcional pero recomendado)
UPDATE public.reserva r
SET precio = s.precio
FROM public.servicio s
WHERE r.servicio_id = s.id AND r.precio IS NULL;
