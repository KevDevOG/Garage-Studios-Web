-- ============================================================
-- 009_update_services_prices.sql
-- Desactivar servicios anteriores y crear el nuevo catálogo oficial
-- de Garage Studios. NO se eliminan servicios con reservas asociadas.
-- ============================================================

-- 1. Desactivar TODOS los servicios actuales (activo = false)
--    Los que tengan reservas siguen en BD pero no se mostrarán al público.
UPDATE public.servicio
SET activo = false
WHERE activo = true;

-- ============================================================
-- 2. Insertar los nuevos servicios oficiales
--    Necesitamos un admin_id válido. Usamos el primer administrador existente.
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.administrador LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No hay ningún administrador en la tabla administrador. Crea uno primero.';
  END IF;

  -- ── PACKS DE CANCIÓN + PRODUCCIÓN ────────────────────────────
  INSERT INTO public.servicio (admin_id, nombre, descripcion, precio, duracion_minutos, categoria, subcategoria, icono, es_pack, activo)
  VALUES
    (v_admin_id, '1 canción + producción',               'Grabación + mezcla + producción.',                          55,  120, 'Grabación', 'Packs Canción', '🎙️', true,  true),
    (v_admin_id, '2 canciones + producción',              'Grabación + mezcla + producción.',                         100,  180, 'Grabación', 'Packs Canción', '🎙️', true,  true),
    (v_admin_id, '3 canciones + producción',              'Grabación + mezcla + producción.',                         135,  240, 'Grabación', 'Packs Canción', '🎙️', true,  true),
    (v_admin_id, 'Grabación por hora',                    'Grabación por hora en estudio.',                            20,   60, 'Grabación', NULL,            '⏱️', false, true),
    (v_admin_id, 'Hora extra en pack canción + producción','Hora extra añadida a un pack de canción + producción.',    10,   60, 'Grabación', NULL,            '➕', false, true),

  -- ── BEATS / INSTRUMENTALES ───────────────────────────────────
    (v_admin_id, 'Licencia básica',    'Beat o instrumental en formato MP3. Usable si lo compran más artistas.',                           30, 30, 'Beats', NULL, '🎵', false, true),
    (v_admin_id, 'Licencia premium',   'Beat o instrumental en formato WAV. Usable por más artistas.',                                     50, 30, 'Beats', NULL, '🎵', false, true),
    (v_admin_id, 'Licencia exclusiva', 'Beat o instrumental en formato WAV de uso exclusivo. El beat pasa a ser del comprador.',           80, 30, 'Beats', NULL, '🎵', false, true),

  -- ── FOTOGRAFÍA ──────────────────────────────────────────────
    (v_admin_id, 'Sesión de fotos 1 hora',  'Sesión fotográfica profesional de 1 hora.',   30,  60, 'Fotografía', NULL, '📷', false, true),
    (v_admin_id, 'Sesión de fotos 2 horas', 'Sesión fotográfica profesional de 2 horas.',  50, 120, 'Fotografía', NULL, '📷', false, true),
    (v_admin_id, 'Sesión de fotos 3 horas', 'Sesión fotográfica profesional de 3 horas.',  80, 180, 'Fotografía', NULL, '📷', false, true),
    (v_admin_id, 'Edición de fotografía',   'Edición adicional de fotografía.',             10,  30, 'Fotografía', NULL, '🖼️', false, true),

  -- ── VIDEOCLIPS ───────────────────────────────────────────────
    (v_admin_id, 'Grabación de videoclip',              'Grabación profesional de videoclip.',                             90,  60, 'Videoclips', NULL, '🎬', false, true),
    (v_admin_id, 'Edición de videoclip',                'Edición profesional de videoclip.',                               75, 120, 'Videoclips', NULL, '✂️', false, true),
    (v_admin_id, 'Pack grabación + edición de videoclip 1h', 'Grabación de videoclip de 1 hora + edición incluida.',      150, 180, 'Videoclips', NULL, '🎬', true,  true);

END $$;
