-- Esquema public reconstruido del catálogo de producción (16-nov-2026, solo estructura)
SET search_path = public, extensions;

CREATE TABLE public.administrador (
  id uuid NOT NULL, email text NOT NULL, nombre text NOT NULL, created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.audit_log (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, admin_id uuid, accion text NOT NULL, entidad text NOT NULL,
  entidad_id uuid, descripcion text, metadata jsonb, created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.bloqueo_horario (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, fecha date NOT NULL, hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL, motivo text, created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(), deleted_at timestamp with time zone
);
CREATE TABLE public.cliente (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, nombre text NOT NULL, email text, telefono text, instagram text,
  notas text, origen text DEFAULT 'web'::text, estado text DEFAULT 'activo'::text, total_reservas integer DEFAULT 0,
  reservas_confirmadas integer DEFAULT 0, reservas_canceladas integer DEFAULT 0, reservas_completadas integer DEFAULT 0,
  ultima_reserva_at timestamp with time zone, ultima_reserva_fecha date, servicio_favorito_id uuid,
  importe_total numeric(10,2) DEFAULT 0, created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(), etiquetas text[] DEFAULT '{}'::text[]
);
CREATE TABLE public.cliente_nota (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, cliente_id uuid NOT NULL, nota text NOT NULL,
  created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone, creado_por uuid
);
CREATE TABLE public.contacto (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, nombre text NOT NULL, email text NOT NULL, telefono text,
  asunto text NOT NULL, mensaje text NOT NULL, leido boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(), accepted_privacy_at timestamp with time zone
);
CREATE TABLE public.finanza_movimiento (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, tipo text NOT NULL, categoria text NOT NULL, concepto text NOT NULL,
  descripcion text, importe numeric(10,2) NOT NULL, fecha date NOT NULL, metodo_pago text, reserva_id uuid,
  cliente_id uuid, servicio_id uuid, recurrente boolean DEFAULT false, notas text,
  created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone
);
CREATE TABLE public.imagen (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, admin_id uuid NOT NULL, titulo text NOT NULL, descripcion text,
  url_imagen text NOT NULL, created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.reserva (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, servicio_id uuid NOT NULL, nombre text NOT NULL, email text NOT NULL,
  telefono text NOT NULL, fecha_reserva date NOT NULL, observaciones text, estado text DEFAULT 'pendiente'::text,
  created_at timestamp with time zone DEFAULT now(), hora_inicio time without time zone, hora_fin time without time zone,
  duracion_minutos integer, origen text DEFAULT 'web'::text, notas_admin text, calendar_event_id text,
  deleted_at timestamp with time zone, updated_at timestamp with time zone DEFAULT now(), precio numeric(10,2),
  cliente_id uuid, confirmacion_email_enviada_at timestamp with time zone,
  confirmacion_whatsapp_enviada_at timestamp with time zone, confirmacion_error text,
  calendar_token uuid DEFAULT uuid_generate_v4(), accepted_privacy_at timestamp with time zone,
  cancelacion_email_enviada_at timestamp with time zone, completada_email_enviada_at timestamp with time zone,
  email_estado_error text, estado_pago text DEFAULT 'pendiente'::text, importe_pagado numeric(10,2) DEFAULT 0,
  pagado_at timestamp with time zone
);
CREATE TABLE public.reserva_bloque (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, reserva_id uuid NOT NULL, titulo text NOT NULL, fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL, hora_fin time without time zone NOT NULL,
  duracion_minutos integer NOT NULL, orden integer DEFAULT 1, estado text DEFAULT 'pendiente'::text,
  created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.servicio (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, admin_id uuid NOT NULL, nombre text NOT NULL, descripcion text NOT NULL,
  precio numeric(10,2) NOT NULL, duracion_minutos integer NOT NULL, activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(), categoria text DEFAULT 'Sonido'::text NOT NULL, subcategoria text,
  icono text DEFAULT '✅'::text NOT NULL, es_pack boolean DEFAULT false NOT NULL, orden integer DEFAULT 999, icono_url text
);
CREATE TABLE public.visuals_imagen (
  id uuid DEFAULT uuid_generate_v4() NOT NULL, titulo text, descripcion text, url_imagen text NOT NULL,
  tipo text DEFAULT 'fotos'::text, destacado boolean DEFAULT false, orden integer DEFAULT 999, activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE administrador ADD CONSTRAINT administrador_pkey PRIMARY KEY (id);
ALTER TABLE audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE bloqueo_horario ADD CONSTRAINT bloqueo_horario_pkey PRIMARY KEY (id);
ALTER TABLE cliente ADD CONSTRAINT cliente_pkey PRIMARY KEY (id);
ALTER TABLE cliente_nota ADD CONSTRAINT cliente_nota_pkey PRIMARY KEY (id);
ALTER TABLE contacto ADD CONSTRAINT contacto_pkey PRIMARY KEY (id);
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_pkey PRIMARY KEY (id);
ALTER TABLE imagen ADD CONSTRAINT imagen_pkey PRIMARY KEY (id);
ALTER TABLE reserva ADD CONSTRAINT reserva_pkey PRIMARY KEY (id);
ALTER TABLE reserva_bloque ADD CONSTRAINT reserva_bloque_pkey PRIMARY KEY (id);
ALTER TABLE servicio ADD CONSTRAINT servicio_pkey PRIMARY KEY (id);
ALTER TABLE visuals_imagen ADD CONSTRAINT visuals_imagen_pkey PRIMARY KEY (id);
ALTER TABLE administrador ADD CONSTRAINT administrador_email_key UNIQUE (email);
ALTER TABLE cliente ADD CONSTRAINT cliente_estado_check CHECK ((estado = ANY (ARRAY['activo'::text, 'inactivo'::text, 'bloqueado'::text])));
ALTER TABLE cliente ADD CONSTRAINT cliente_origen_check CHECK ((origen = ANY (ARRAY['web'::text, 'manual'::text, 'instagram'::text, 'whatsapp'::text, 'referido'::text, 'otro'::text])));
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_importe_check CHECK ((importe > (0)::numeric));
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_metodo_pago_check CHECK (((metodo_pago = ANY (ARRAY['efectivo'::text, 'transferencia'::text, 'tarjeta'::text, 'bizum'::text, 'otro'::text])) OR (metodo_pago IS NULL)));
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_tipo_check CHECK ((tipo = ANY (ARRAY['ingreso'::text, 'gasto'::text])));
ALTER TABLE reserva ADD CONSTRAINT ck_reserva_estado_pago CHECK ((estado_pago = ANY (ARRAY['pendiente'::text, 'parcial'::text, 'pagado'::text])));
ALTER TABLE reserva ADD CONSTRAINT reserva_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'cancelada'::text, 'rechazada'::text, 'completada'::text])));
ALTER TABLE reserva_bloque ADD CONSTRAINT reserva_bloque_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'cancelada'::text, 'rechazada'::text, 'completada'::text])));
ALTER TABLE visuals_imagen ADD CONSTRAINT visuals_imagen_tipo_check CHECK ((tipo = ANY (ARRAY['fotos'::text, 'grabaciones'::text, 'rodajes'::text])));
ALTER TABLE reserva ADD CONSTRAINT reserva_no_overlap EXCLUDE USING gist (tsrange((fecha_reserva + hora_inicio), (fecha_reserva + hora_fin)) WITH &&) WHERE (((estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text])) AND (deleted_at IS NULL)));
ALTER TABLE cliente ADD CONSTRAINT cliente_servicio_favorito_id_fkey FOREIGN KEY (servicio_favorito_id) REFERENCES servicio(id) ON DELETE SET NULL;
ALTER TABLE cliente_nota ADD CONSTRAINT cliente_nota_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE;
ALTER TABLE cliente_nota ADD CONSTRAINT cliente_nota_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES auth.users(id);
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE SET NULL;
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES reserva(id) ON DELETE SET NULL;
ALTER TABLE finanza_movimiento ADD CONSTRAINT finanza_movimiento_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES servicio(id) ON DELETE SET NULL;
ALTER TABLE imagen ADD CONSTRAINT imagen_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES administrador(id) ON DELETE CASCADE;
ALTER TABLE reserva ADD CONSTRAINT reserva_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE SET NULL;
ALTER TABLE reserva ADD CONSTRAINT reserva_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES servicio(id) ON DELETE CASCADE;
ALTER TABLE reserva_bloque ADD CONSTRAINT reserva_bloque_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES reserva(id) ON DELETE CASCADE;
ALTER TABLE servicio ADD CONSTRAINT servicio_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES administrador(id) ON DELETE CASCADE;

CREATE INDEX idx_audit_log_admin ON public.audit_log USING btree (admin_id);
CREATE INDEX idx_bloque_fecha ON public.reserva_bloque USING btree (fecha);
CREATE INDEX idx_bloque_reserva ON public.reserva_bloque USING btree (reserva_id);
CREATE INDEX idx_bloqueo_horario_fecha ON public.bloqueo_horario USING btree (fecha);
CREATE INDEX idx_reserva_fecha ON public.reserva USING btree (fecha_reserva);
CREATE INDEX idx_reserva_estado ON public.reserva USING btree (estado);
CREATE UNIQUE INDEX idx_cliente_email_unique ON public.cliente USING btree (email) WHERE (email IS NOT NULL);
CREATE UNIQUE INDEX idx_cliente_telefono_unique ON public.cliente USING btree (telefono) WHERE (telefono IS NOT NULL);
CREATE UNIQUE INDEX idx_reserva_calendar_token ON public.reserva USING btree (calendar_token);

CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_fecha date)
 RETURNS TABLE(hora_inicio time without time zone, hora_fin time without time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.hora_inicio, r.hora_fin FROM public.reserva r
    WHERE r.fecha_reserva = p_fecha AND r.estado IN ('pendiente', 'confirmada') AND r.deleted_at IS NULL
      AND r.hora_inicio IS NOT NULL AND r.hora_fin IS NOT NULL;
  RETURN QUERY SELECT rb.hora_inicio, rb.hora_fin FROM public.reserva_bloque rb
    WHERE rb.fecha = p_fecha AND rb.estado IN ('pendiente', 'confirmada');
  RETURN QUERY SELECT bh.hora_inicio, bh.hora_fin FROM public.bloqueo_horario bh
    WHERE bh.fecha = p_fecha AND bh.deleted_at IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_reserva_pagado_at()
 RETURNS trigger LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado_pago = 'pagado' AND (OLD.estado_pago IS NULL OR OLD.estado_pago != 'pagado') THEN
        NEW.pagado_at := NOW();
    ELSIF NEW.estado_pago != 'pagado' THEN
        NEW.pagado_at := NULL;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE TRIGGER trg_reserva_pagado_at BEFORE UPDATE ON public.reserva FOR EACH ROW WHEN ((old.estado_pago IS DISTINCT FROM new.estado_pago)) EXECUTE FUNCTION handle_reserva_pagado_at();

ALTER TABLE administrador ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueo_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_nota ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanza_movimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagen ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva_bloque ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE visuals_imagen ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_authenticated_all ON public.administrador AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY imagen_admin_all ON public.imagen AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY imagen_public_read ON public.imagen AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY contacto_admin_all ON public.contacto AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY contacto_public_insert ON public.contacto AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY bloque_admin_all ON public.reserva_bloque AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY audit_admin_all ON public.audit_log AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY servicio_admin_all ON public.servicio AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY servicio_public_read ON public.servicio AS PERMISSIVE FOR SELECT TO anon USING ((activo = true));
CREATE POLICY "Administradores tienen acceso total a visuals_imagen" ON public.visuals_imagen AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Público puede ver imágenes activas de visuals" ON public.visuals_imagen AS PERMISSIVE FOR SELECT TO public USING (((activo = true) AND (deleted_at IS NULL)));
CREATE POLICY cliente_admin_all ON public.cliente AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY cliente_anon_select_on_insert ON public.cliente AS PERMISSIVE FOR SELECT TO anon USING ((current_setting('request.method'::text, true) = 'POST'::text));
CREATE POLICY cliente_public_insert ON public.cliente AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin full access on bloqueo_horario" ON public.bloqueo_horario AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() IN ( SELECT users.id FROM auth.users))) WITH CHECK ((auth.uid() IN ( SELECT users.id FROM auth.users)));
CREATE POLICY bloqueo_admin_all ON public.bloqueo_horario AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY reserva_admin_all ON public.reserva AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY reserva_public_insert ON public.reserva AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins pueden borrar notas de clientes (lógico)" ON public.cliente_nota AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY "Admins pueden crear notas de clientes" ON public.cliente_nota AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins pueden editar notas de clientes" ON public.cliente_nota AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins pueden ver notas de clientes" ON public.cliente_nota AS PERMISSIVE FOR SELECT TO authenticated USING ((deleted_at IS NULL));
CREATE POLICY cliente_nota_admin_all ON public.cliente_nota AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público de lectura a galeria" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'galeria'::text));
CREATE POLICY "Authenticated Delete Access on garage-visuals" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING ((bucket_id = 'garage-visuals'::text));
CREATE POLICY "Authenticated Update Access on garage-visuals" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING ((bucket_id = 'garage-visuals'::text)) WITH CHECK ((bucket_id = 'garage-visuals'::text));
CREATE POLICY "Authenticated Upload Access on garage-visuals" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'garage-visuals'::text));
CREATE POLICY "Public Read Access on garage-visuals" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'garage-visuals'::text));
CREATE POLICY "Usuarios autenticados pueden eliminar de galeria" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'galeria'::text) AND (auth.role() = 'authenticated'::text)));
CREATE POLICY "Usuarios autenticados pueden subir a galeria" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'galeria'::text) AND (auth.role() = 'authenticated'::text)));
CREATE POLICY finanza_admin_all ON public.finanza_movimiento AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Privilegios por defecto de Supabase sobre public
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
