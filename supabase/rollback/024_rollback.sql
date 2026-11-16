-- ============================================================
-- ROLLBACK DE LA MIGRACIÓN 024 (transaccional)
-- ============================================================
-- Úsalo si, tras aplicar la 024, la web no puede crear reservas (p. ej.
-- porque falta SUPABASE_SERVICE_ROLE_KEY en Vercel). Restaura los permisos
-- por defecto de Supabase para anon y las políticas públicas de la 022.
-- Vuelve a permitir saltarse el antispam con la anon key: es temporal.
-- ============================================================

BEGIN;

GRANT ALL ON
  public.reserva, public.cliente, public.contacto, public.cliente_nota,
  public.finanza_movimiento, public.bloqueo_horario, public.reserva_bloque,
  public.servicio, public.imagen, public.visuals_imagen
TO anon;

-- 023 retira a anon el acceso a estas dos: se respeta si está aplicada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = 'private'::regnamespace) THEN
    GRANT ALL ON public.audit_log, public.administrador TO anon;
  END IF;
END $$;

-- Políticas públicas de la 022 (mismas condiciones)
CREATE POLICY "reserva_public_insert" ON public.reserva
  FOR INSERT TO anon
  WITH CHECK (
    estado = 'pendiente' AND estado_pago = 'pendiente' AND importe_pagado = 0 AND pagado_at IS NULL
    AND deleted_at IS NULL AND notas_admin IS NULL AND calendar_event_id IS NULL AND origen = 'web'
    AND accepted_privacy_at IS NOT NULL AND hora_inicio IS NOT NULL AND hora_fin IS NOT NULL
    AND hora_fin > hora_inicio
    AND confirmacion_email_enviada_at IS NULL AND confirmacion_whatsapp_enviada_at IS NULL
    AND cancelacion_email_enviada_at IS NULL AND completada_email_enviada_at IS NULL
    AND confirmacion_error IS NULL AND email_estado_error IS NULL
    AND fecha_reserva >= (now() AT TIME ZONE 'Atlantic/Canary')::date
    AND fecha_reserva <= (now() AT TIME ZONE 'Atlantic/Canary')::date + 730
    AND length(nombre) BETWEEN 2 AND 200 AND length(email) <= 254 AND length(telefono) <= 40
    AND length(coalesce(observaciones, '')) <= 2000
    AND EXISTS (
      SELECT 1 FROM public.servicio s
      WHERE s.id = reserva.servicio_id AND s.activo = true
        AND s.precio IS NOT DISTINCT FROM reserva.precio
        AND s.duracion_minutos = reserva.duracion_minutos
    )
    AND extract(epoch FROM hora_fin) - extract(epoch FROM hora_inicio) = duracion_minutos * 60
  );

CREATE POLICY "contacto_public_insert" ON public.contacto
  FOR INSERT TO anon
  WITH CHECK (
    coalesce(leido, false) = false AND accepted_privacy_at IS NOT NULL
    AND length(nombre) BETWEEN 2 AND 200 AND length(email) <= 254
    AND length(coalesce(telefono, '')) <= 40 AND length(asunto) <= 200 AND length(mensaje) <= 5000
  );

CREATE POLICY "cliente_public_insert" ON public.cliente
  FOR INSERT TO anon
  WITH CHECK (
    origen = 'web' AND estado = 'activo'
    AND coalesce(total_reservas, 0) = 0 AND coalesce(reservas_confirmadas, 0) = 0
    AND coalesce(reservas_canceladas, 0) = 0 AND coalesce(reservas_completadas, 0) = 0
    AND coalesce(importe_total, 0) = 0 AND notas IS NULL AND servicio_favorito_id IS NULL
    AND ultima_reserva_at IS NULL AND coalesce(array_length(etiquetas, 1), 0) = 0
    AND length(nombre) BETWEEN 2 AND 200 AND length(coalesce(email, '')) <= 254
    AND length(coalesce(telefono, '')) <= 40 AND length(coalesce(instagram, '')) <= 100
  );

CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente
  FOR SELECT TO anon
  USING (created_at = now());

COMMIT;
