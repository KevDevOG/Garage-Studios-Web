-- Añadir columna de icono_url a los servicios
ALTER TABLE public.servicio
ADD COLUMN IF NOT EXISTS icono_url TEXT;

-- Actualizar iconos con los GIFs locales
-- Grabación y Producción (Micrófono)
UPDATE public.servicio SET icono_url = '/icons/services/microfono.gif' WHERE nombre IN ('1 canción + producción', '2 canciones + producción', '3 canciones + producción', 'Grabación por hora');

-- Hora extra (Pista de tiempo)
UPDATE public.servicio SET icono_url = '/icons/services/pista-de-tiempo.gif' WHERE nombre = 'Hora extra en pack canción + producción';

-- Licencias / Beats (CD)
UPDATE public.servicio SET icono_url = '/icons/services/cd.gif' WHERE nombre IN ('Licencia básica', 'Licencia premium', 'Licencia exclusiva');

-- Fotografía (Frente de cámara)
UPDATE public.servicio SET icono_url = '/icons/services/frente-de-camara.gif' WHERE nombre IN ('Sesión de fotos 1 hora', 'Sesión de fotos 2 horas', 'Sesión de fotos 3 horas');

-- Edición de fotografía
UPDATE public.servicio SET icono_url = '/icons/services/edicion-de-fotografias.gif' WHERE nombre = 'Edición de fotografía';

-- Videoclips / Edición de video
UPDATE public.servicio SET icono_url = '/icons/services/edicion-de-video.gif' WHERE nombre IN ('Grabación de videoclip', 'Edición de videoclip', 'Pack grabación + edición de videoclip 1h');

-- Fallback para cualquier otro servicio activo que no tenga icono
UPDATE public.servicio SET icono_url = '/icons/services/mas.gif' WHERE icono_url IS NULL AND activo = true;
