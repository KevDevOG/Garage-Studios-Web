-- ============================================================
-- MIGRACIÓN 020: Protección robusta contra solapamientos (Race Conditions)
-- ============================================================

-- Habilitar la extensión btree_gist necesaria para usar EXCLUDE con gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Añadir una restricción de exclusión en la tabla reserva
-- Asegura a nivel de base de datos que ninguna reserva activa (pendiente o confirmada)
-- pueda solaparse en el mismo rango de tiempo para el mismo día.
ALTER TABLE public.reserva
  ADD CONSTRAINT reserva_no_overlap
  EXCLUDE USING gist (
    tsrange(
      (fecha_reserva + hora_inicio)::timestamp, 
      (fecha_reserva + hora_fin)::timestamp
    ) WITH &&
  )
  WHERE (estado IN ('pendiente', 'confirmada') AND deleted_at IS NULL);
