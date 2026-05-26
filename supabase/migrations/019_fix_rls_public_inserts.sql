-- ============================================================
-- MIGRACIÓN 019: Arreglar RLS para inserciones públicas
-- ============================================================

-- El flujo de reserva pública utiliza .insert([...]).select() para crear
-- un nuevo cliente de forma anónima. Sin embargo, Supabase/PostgREST requiere
-- que el rol tenga permisos de SELECT para poder devolver el registro insertado.
-- Como no queremos que 'anon' pueda leer (SELECT) la tabla entera, permitimos
-- SELECT únicamente durante peticiones POST (inserciones). PostgREST garantiza
-- que en una petición POST solo se devuelven los registros afectados por la mutación.

ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_anon_select_on_insert" ON public.cliente;

CREATE POLICY "cliente_anon_select_on_insert" ON public.cliente
  FOR SELECT
  TO anon
  USING (current_setting('request.method', true) = 'POST');
