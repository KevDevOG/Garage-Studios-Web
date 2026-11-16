-- ============================================================
-- MANTENIMIENTO: reasignar los servicios del administrador huérfano
-- ============================================================
-- ESTADO: PREPARADO Y VALIDADO EN POSTGRESQL (PGlite). NO EJECUTADO EN PRODUCCIÓN.
--
-- Situación medida el 16-nov-2026 (solo lectura):
--   * administrador 9326d456-… (admin@garagestudios.com) NO tiene cuenta en
--     Auth y figura como dueño de 15 servicios (14 activos).
--   * Esos servicios tienen 68 reservas y son el favorito de 18 clientes;
--     0 movimientos de finanzas, 0 imágenes, 0 notas, 0 filas de auditoría.
--   * Cuenta legítima 0dc87e42-… (admin@garagestudios.es): confirmada, sin
--     banear, con 27 servicios.
--   * ¡Cuidado! Hoy la FK servicio → administrador es ON DELETE CASCADE:
--     borrar la fila huérfana ANTES de reasignar borraría los 15 servicios y,
--     en cascada, sus 68 reservas. Este script NO borra nada.
--
-- Qué hace: cambia solo `servicio.admin_id`. Las reservas, clientes y
-- finanzas apuntan a `servicio.id`, que no cambia: no se tocan.
-- Es transaccional y aborta si cualquier recuento no coincide.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_huerfano constant uuid := '9326d456-0ce5-49b0-b6e1-04d4b80283b1';
  v_legitimo constant uuid := '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a';
  v_servicios int;
  v_reservas_antes int;
  v_favoritos_antes int;
  v_legitimo_antes int;
  v_n int;
BEGIN
  -- Preflight: la cuenta legítima existe, está en la lista y es utilizable
  IF NOT EXISTS (
    SELECT 1 FROM public.administrador a JOIN auth.users u ON u.id = a.id
    WHERE a.id = v_legitimo AND u.deleted_at IS NULL AND u.email_confirmed_at IS NOT NULL
      AND (u.banned_until IS NULL OR u.banned_until <= now())
  ) THEN
    RAISE EXCEPTION 'Abortado: la cuenta legítima no está en administrador o no es utilizable';
  END IF;

  -- La huérfana sigue sin cuenta de Auth (si ahora tuviera una, revisar a mano)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_huerfano) THEN
    RAISE EXCEPTION 'Abortado: el administrador % ahora tiene cuenta en Auth; revisar antes de reasignar', v_huerfano;
  END IF;

  SELECT count(*) INTO v_servicios FROM public.servicio WHERE admin_id = v_huerfano;
  IF v_servicios <> 15 THEN
    RAISE EXCEPTION 'Abortado: se esperaban 15 servicios del huérfano y hay %', v_servicios;
  END IF;

  SELECT count(*) INTO v_reservas_antes FROM public.reserva r
    JOIN public.servicio s ON s.id = r.servicio_id WHERE s.admin_id = v_huerfano;
  SELECT count(*) INTO v_favoritos_antes FROM public.cliente c
    JOIN public.servicio s ON s.id = c.servicio_favorito_id WHERE s.admin_id = v_huerfano;
  SELECT count(*) INTO v_legitimo_antes FROM public.servicio WHERE admin_id = v_legitimo;

  -- Reasignación
  UPDATE public.servicio SET admin_id = v_legitimo WHERE admin_id = v_huerfano;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 15 THEN RAISE EXCEPTION 'Abortado: se actualizaron % servicios', v_n; END IF;

  -- Postflight
  IF EXISTS (SELECT 1 FROM public.servicio WHERE admin_id = v_huerfano) THEN
    RAISE EXCEPTION 'Abortado: quedan servicios del huérfano';
  END IF;
  SELECT count(*) INTO v_n FROM public.servicio WHERE admin_id = v_legitimo;
  IF v_n <> v_legitimo_antes + 15 THEN
    RAISE EXCEPTION 'Abortado: la cuenta legítima tiene % servicios (esperados %)', v_n, v_legitimo_antes + 15;
  END IF;
  SELECT count(*) INTO v_n FROM public.reserva r
    JOIN public.servicio s ON s.id = r.servicio_id WHERE s.admin_id = v_legitimo;
  IF v_n < v_reservas_antes THEN
    RAISE EXCEPTION 'Abortado: se han perdido reservas vinculadas';
  END IF;
  SELECT count(*) INTO v_n FROM public.cliente WHERE servicio_favorito_id IS NOT NULL;
  IF v_n < v_favoritos_antes THEN
    RAISE EXCEPTION 'Abortado: se han perdido servicios favoritos de clientes';
  END IF;

  RAISE NOTICE 'OK: 15 servicios reasignados (% reservas y % clientes siguen vinculados)', v_reservas_antes, v_favoritos_antes;
END $$;

COMMIT;

-- ── Paso OPCIONAL posterior (en otra ejecución, tras comprobar el panel) ──
-- Borrar la fila huérfana solo cuando ya no tenga referencias y con la 022
-- aplicada (FK en RESTRICT: si quedara alguna referencia, el DELETE falla
-- en lugar de borrar en cascada).
--
-- BEGIN;
-- DO $$ BEGIN
--   IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'servicio_admin_id_fkey' AND confdeltype = 'c') THEN
--     RAISE EXCEPTION 'Abortado: la FK sigue en CASCADE; aplicar antes la 022';
--   END IF;
-- END $$;
-- DELETE FROM public.administrador WHERE id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1';
-- COMMIT;
--
-- Rollback de la reasignación (solo si hiciera falta, antes de borrar la fila):
--   UPDATE public.servicio SET admin_id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1'
--   WHERE id IN (<los 15 id anotados antes de ejecutar>);
-- Anota los id antes con:
--   SELECT id, nombre FROM public.servicio WHERE admin_id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1';
