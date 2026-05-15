-- Añadir columna de orden a los servicios
ALTER TABLE public.servicio
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 999;

-- Actualizar el orden comercial según el requerimiento
-- 1. Packs de canciones
UPDATE public.servicio SET orden = 1 WHERE nombre = '1 canción + producción';
UPDATE public.servicio SET orden = 2 WHERE nombre = '2 canciones + producción';
UPDATE public.servicio SET orden = 3 WHERE nombre = '3 canciones + producción';
UPDATE public.servicio SET orden = 4 WHERE nombre = 'Hora extra en pack canción + producción';

-- 2. Grabación base
UPDATE public.servicio SET orden = 5 WHERE nombre = 'Grabación por hora';

-- 3. Licencias (Beats)
UPDATE public.servicio SET orden = 6 WHERE nombre = 'Licencia básica';
UPDATE public.servicio SET orden = 7 WHERE nombre = 'Licencia premium';
UPDATE public.servicio SET orden = 8 WHERE nombre = 'Licencia exclusiva';

-- 4. Fotografía
UPDATE public.servicio SET orden = 9 WHERE nombre = 'Sesión de fotos 1 hora';
UPDATE public.servicio SET orden = 10 WHERE nombre = 'Sesión de fotos 2 horas';
UPDATE public.servicio SET orden = 11 WHERE nombre = 'Sesión de fotos 3 horas';
UPDATE public.servicio SET orden = 12 WHERE nombre = 'Edición de fotografía';

-- 5. Videoclips
UPDATE public.servicio SET orden = 13 WHERE nombre = 'Grabación de videoclip';
UPDATE public.servicio SET orden = 14 WHERE nombre = 'Edición de videoclip';
UPDATE public.servicio SET orden = 15 WHERE nombre = 'Pack grabación + edición de videoclip 1h';

-- Asegurar que los servicios que no estén en la lista tengan un orden mayor
UPDATE public.servicio SET orden = 999 WHERE orden IS NULL;
