-- Datos sintéticos con la misma forma que producción (sin datos personales)
SET search_path = public, extensions;

INSERT INTO auth.users (id, email, email_confirmed_at, is_anonymous)
VALUES ('0dc87e42-370c-49ae-b1fa-3e61fbea1e3a', 'admin@garagestudios.es', now(), false),
       ('aaaaaaaa-0000-4000-8000-00000000000a', 'registrado@example.com', now(), false); -- alguien que usó el registro abierto

INSERT INTO administrador (id, email, nombre) VALUES
  ('9326d456-0ce5-49b0-b6e1-04d4b80283b1', 'admin@garagestudios.com', 'Garage Admin'),   -- huérfana
  ('0dc87e42-370c-49ae-b1fa-3e61fbea1e3a', 'admin@garagestudios.es', 'Admin');           -- legítima

-- 15 servicios de la fila huérfana (14 activos) y 27 de la legítima
INSERT INTO servicio (id, admin_id, nombre, descripcion, precio, duracion_minutos, activo, categoria)
SELECT ('10000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, '9326d456-0ce5-49b0-b6e1-04d4b80283b1',
       'Servicio H' || g, 'x', 50 + g, 60, g <> 15, 'Sonido'
FROM generate_series(1, 15) g;
INSERT INTO servicio (id, admin_id, nombre, descripcion, precio, duracion_minutos, activo, categoria)
SELECT ('20000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a',
       'Servicio L' || g, 'x', 30 + g, 120, true, 'Sonido'
FROM generate_series(1, 27) g;

INSERT INTO imagen (admin_id, titulo, url_imagen)
SELECT '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a', 'Imagen ' || g, 'https://example.com/' || g || '.jpg' FROM generate_series(1, 7) g;

-- 68 reservas sobre servicios de la fila huérfana, en el pasado (completadas)
INSERT INTO reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, origen, precio)
SELECT ('10000000-0000-4000-8000-' || lpad((1 + g % 15)::text, 12, '0'))::uuid, 'Cliente ' || g, 'c' || g || '@example.com',
       '6000000' || lpad(g::text, 2, '0'), date '2026-01-01' + g, '17:00', '18:00', 60, 'completada', 'web', 50
FROM generate_series(1, 68) g;

-- Reserva histórica que termina "a las 00:00" (como la de producción)
INSERT INTO reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, origen, precio)
VALUES ('20000000-0000-4000-8000-000000000001', 'Histórica', 'h@example.com', '600000099', '2026-07-26', '23:00', '00:00', 60, 'completada', 'web', 31);

-- 18 clientes con servicio favorito de la fila huérfana
INSERT INTO cliente (nombre, email, servicio_favorito_id)
SELECT 'Cliente ' || g, 'fav' || g || '@example.com', ('10000000-0000-4000-8000-' || lpad((1 + g % 15)::text, 12, '0'))::uuid
FROM generate_series(1, 18) g;

INSERT INTO bloqueo_horario (fecha, hora_inicio, hora_fin, motivo, deleted_at)
VALUES ('2026-05-01', '10:00', '14:00', 'histórico', now()), ('2026-06-01', '16:00', '18:00', 'histórico', NULL);
