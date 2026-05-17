-- Migración para renombrar los servicios de la categoría Beats / Instrumentales
-- Esto añade más claridad para los usuarios en la web.

UPDATE public.servicio
SET nombre = 'Beat licencia básica'
WHERE nombre = 'Licencia básica';

UPDATE public.servicio
SET nombre = 'Beat licencia premium'
WHERE nombre = 'Licencia premium';

UPDATE public.servicio
SET nombre = 'Beat licencia exclusiva'
WHERE nombre = 'Licencia exclusiva';
