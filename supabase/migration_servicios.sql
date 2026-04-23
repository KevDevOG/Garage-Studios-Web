-- Añadir nuevas columnas a la tabla servicio
ALTER TABLE public.servicio ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Sonido';
ALTER TABLE public.servicio ADD COLUMN subcategoria TEXT;
ALTER TABLE public.servicio ADD COLUMN icono TEXT NOT NULL DEFAULT '✅';
ALTER TABLE public.servicio ADD COLUMN es_pack BOOLEAN NOT NULL DEFAULT FALSE;
