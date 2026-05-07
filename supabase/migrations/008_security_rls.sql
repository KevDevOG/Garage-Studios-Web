-- ============================================================
-- MIGRACIÓN 008: Seguridad RLS + Tabla Audit Log (CORREGIDA)
-- Garage Studios — Security Hardening
-- ============================================================
-- EJECUTAR en Supabase SQL Editor
-- REVISAR antes de ejecutar — activar RLS bloquea todo acceso
-- que no tenga una política explícita.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIÓN UUID (por si no existe)
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA AUDIT_LOG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  descripcion TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad ON public.audit_log(entidad);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.audit_log(admin_id);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS EN TABLA: reserva
-- ─────────────────────────────────────────────────────────────
-- Público puede INSERTAR reservas (formulario web)
-- Admin autenticado puede hacer todo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.reserva ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes si las hay
DROP POLICY IF EXISTS "reserva_public_insert" ON public.reserva;
DROP POLICY IF EXISTS "reserva_admin_all" ON public.reserva;

-- Público: solo insertar
CREATE POLICY "reserva_public_insert" ON public.reserva
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin: acceso completo
CREATE POLICY "reserva_admin_all" ON public.reserva
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS EN TABLA: contacto
-- ─────────────────────────────────────────────────────────────
-- Público puede INSERTAR (formulario de contacto)
-- Admin puede leer y actualizar
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.contacto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacto_public_insert" ON public.contacto;
DROP POLICY IF EXISTS "contacto_admin_all" ON public.contacto;

CREATE POLICY "contacto_public_insert" ON public.contacto
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "contacto_admin_all" ON public.contacto
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS EN TABLA: cliente
-- ─────────────────────────────────────────────────────────────
-- Público NO puede leer clientes
-- Público NO puede actualizar clientes
-- Público SOLO puede insertar (desde el flujo de reservas)
-- Admin puede hacer todo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_public_insert" ON public.cliente;
DROP POLICY IF EXISTS "cliente_public_update" ON public.cliente;
DROP POLICY IF EXISTS "cliente_public_select_by_email" ON public.cliente;
DROP POLICY IF EXISTS "cliente_admin_all" ON public.cliente;

-- Público: insertar nuevos clientes (desde el flujo de reservas)
-- NOTA: Se crea un nuevo registro sin buscar si existe para máxima seguridad.
CREATE POLICY "cliente_public_insert" ON public.cliente
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin: acceso completo
CREATE POLICY "cliente_admin_all" ON public.cliente
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS EN TABLA: finanza_movimiento
-- ─────────────────────────────────────────────────────────────
-- NUNCA público. Solo admin autenticado.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.finanza_movimiento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finanza_admin_all" ON public.finanza_movimiento;

CREATE POLICY "finanza_admin_all" ON public.finanza_movimiento
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. RLS EN TABLA: servicio
-- ─────────────────────────────────────────────────────────────
-- Público puede LEER servicios activos (para la web y reservas)
-- Admin puede hacer todo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.servicio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicio_public_read" ON public.servicio;
DROP POLICY IF EXISTS "servicio_admin_all" ON public.servicio;

-- Público: leer solo servicios activos
CREATE POLICY "servicio_public_read" ON public.servicio
  FOR SELECT
  TO anon
  USING (activo = true);

-- Admin: acceso completo (incluye inactivos)
CREATE POLICY "servicio_admin_all" ON public.servicio
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 7. RLS EN TABLA: imagen
-- ─────────────────────────────────────────────────────────────
-- Público puede LEER imágenes (galería pública)
-- Admin puede hacer todo
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.imagen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imagen_public_read" ON public.imagen;
DROP POLICY IF EXISTS "imagen_admin_all" ON public.imagen;

CREATE POLICY "imagen_public_read" ON public.imagen
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "imagen_admin_all" ON public.imagen
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 8. RLS EN TABLA: reserva_bloque
-- ─────────────────────────────────────────────────────────────
-- Solo admin
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.reserva_bloque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bloque_admin_all" ON public.reserva_bloque;

CREATE POLICY "bloque_admin_all" ON public.reserva_bloque
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 9. RLS EN TABLA: audit_log
-- ─────────────────────────────────────────────────────────────
-- Solo admin puede leer e insertar
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_log;

CREATE POLICY "audit_admin_all" ON public.audit_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- NOTA SOBRE TABLA: administrador
-- ─────────────────────────────────────────────────────────────
-- Solo admins autenticados pueden acceder.
-- El público no puede insertar ni leer.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'administrador'
  ) THEN
    EXECUTE 'ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admin_authenticated_all" ON public.administrador';
    EXECUTE 'CREATE POLICY "admin_authenticated_all" ON public.administrador FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    
    -- Eliminamos cualquier política de inserción pública anterior
    EXECUTE 'DROP POLICY IF EXISTS "admin_public_insert" ON public.administrador';
  END IF;
END $$;

-- ============================================================
-- ROLLBACK (ejecutar solo si necesitas revertir TODO):
--
-- -- Desactivar RLS en todas las tablas
-- ALTER TABLE public.reserva DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contacto DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cliente DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.finanza_movimiento DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.servicio DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.imagen DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reserva_bloque DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
--
-- -- Borrar tabla audit_log
-- DROP TABLE IF EXISTS public.audit_log;
-- ============================================================
