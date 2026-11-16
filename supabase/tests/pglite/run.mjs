// ── Validación de las migraciones 022/023/024 contra PostgreSQL real (PGlite) ──
// PGlite NO es dependencia del proyecto: instálalo en una carpeta temporal y
// pásala en PGLITE_DIR (ver docs/migraciones-022-023.md §2b):
//   npm install --prefix <tmp> --ignore-scripts @electric-sql/pglite@0.5.16
//   PGLITE_DIR=<tmp> node supabase/tests/pglite/run.mjs
// 01_prod_schema.sql es la ESTRUCTURA de producción (sin datos) extraída del
// catálogo el 16-nov-2026; 02_fixtures.sql son datos sintéticos.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PGLITE_DIR = process.env.PGLITE_DIR;
if (!PGLITE_DIR) {
  console.error('Define PGLITE_DIR con la carpeta donde instalaste @electric-sql/pglite.');
  process.exit(2);
}
const mod = (p) => import(pathToFileURL(join(PGLITE_DIR, 'node_modules/@electric-sql/pglite/dist', p)).href);
const { PGlite } = await mod('index.js');
const { btree_gist } = await mod('contrib/btree_gist.js');
const { uuid_ossp } = await mod('contrib/uuid_ossp.js');

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const repo = (p) => readFileSync(join(REPO, p), 'utf8');
const local = (p) => readFileSync(join(HERE, p), 'utf8');

const results = [];
let failures = 0;

async function freshDb() {
  const db = new PGlite({ extensions: { btree_gist, uuid_ossp } });
  await db.exec(local('00_supabase_stub.sql'));
  await db.exec(local('01_prod_schema.sql'));
  await db.exec(local('02_fixtures.sql'));
  await db.exec('SET search_path = public, extensions;');
  return db;
}

async function step(db, label, sql, { expectNotice, expectError } = {}) {
  const notices = [];
  try {
    await db.exec(sql, { onNotice: (n) => notices.push(n.message) });
    if (expectError) {
      failures++;
      results.push(`✖ ${label}: se esperaba error "${expectError}" y no lo hubo`);
      return notices;
    }
    const oks = notices.filter((m) => m.startsWith('OK')).length;
    if (expectNotice && !notices.some((m) => m.includes(expectNotice))) {
      failures++;
      results.push(`✖ ${label}: falta "${expectNotice}". Últimos avisos: ${notices.slice(-3).join(' | ')}`);
    } else {
      results.push(`✔ ${label}${oks ? ` (${oks} comprobaciones OK)` : ''}`);
    }
  } catch (e) {
    await db.exec('ROLLBACK;').catch(() => {});
    if (expectError && String(e.message).includes(expectError)) {
      results.push(`✔ ${label} (aborta como se espera: ${e.message.slice(0, 90)})`);
    } else {
      failures++;
      results.push(`✖ ${label}: ${e.message}`);
    }
  }
  return notices;
}

async function policySnapshot(db) {
  const r = await db.query(`
    select schemaname||'.'||tablename t, cmd, array_to_string(roles, ',') roles,
           coalesce(qual,'') q, coalesce(with_check,'') w
    from pg_policies where schemaname in ('public','storage') order by 1,2,3,4,5`);
  return r.rows.map((x) => `${x.t}|${x.cmd}|${x.roles}|${x.q}|${x.w}`);
}

// Permisos efectivos de la cuenta legítima (después de 023 + 022)
const ADMIN_PERMS = `
BEGIN;
SELECT set_config('request.jwt.claims', '{"sub":"0dc87e42-370c-49ae-b1fa-3e61fbea1e3a","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $t$
DECLARE t text; v_n int;
BEGIN
  FOREACH t IN ARRAY ARRAY['bloqueo_horario','cliente','cliente_nota','contacto','finanza_movimiento','imagen','reserva','reserva_bloque','servicio','visuals_imagen','audit_log','administrador']
  LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO v_n;
  END LOOP;
  SELECT count(*) INTO v_n FROM public.servicio; IF v_n < 42 THEN RAISE EXCEPTION 'FALLO: el admin ve % servicios', v_n; END IF;
  SELECT count(*) INTO v_n FROM public.reserva; IF v_n < 69 THEN RAISE EXCEPTION 'FALLO: el admin ve % reservas', v_n; END IF;
  RAISE NOTICE 'OK P01 lectura de las 12 tablas del panel (42 servicios, 69+ reservas)';

  INSERT INTO public.servicio (id, admin_id, nombre, descripcion, precio, duracion_minutos, categoria)
  VALUES ('30000000-0000-4000-8000-000000000001', auth.uid(), 'Nuevo', 'x', 10, 60, 'Sonido');
  UPDATE public.servicio SET precio = 11 WHERE id = '30000000-0000-4000-8000-000000000001';
  DELETE FROM public.servicio WHERE id = '30000000-0000-4000-8000-000000000001';
  RAISE NOTICE 'OK P02 crear, editar y borrar servicios';

  INSERT INTO public.cliente (id, nombre, email, origen) VALUES ('30000000-0000-4000-8000-000000000002', 'Manual', 'manual@example.com', 'manual');
  INSERT INTO public.cliente_nota (cliente_id, nota, creado_por) VALUES ('30000000-0000-4000-8000-000000000002', 'nota', auth.uid());
  UPDATE public.cliente SET notas = 'VIP', etiquetas = ARRAY['vip'] WHERE id = '30000000-0000-4000-8000-000000000002';
  RAISE NOTICE 'OK P03 clientes y notas';

  INSERT INTO public.reserva (id, servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, origen, precio)
  VALUES ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Manual', 'm@example.com', '600000123',
          (now() AT TIME ZONE 'Atlantic/Canary')::date + 200, '10:00', '12:00', 120, 'confirmada', 'manual', 31);
  UPDATE public.reserva SET estado_pago = 'pagado', importe_pagado = 31 WHERE id = '30000000-0000-4000-8000-000000000003';
  SELECT count(*) INTO v_n FROM public.reserva WHERE id = '30000000-0000-4000-8000-000000000003' AND pagado_at IS NOT NULL;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FALLO: el trigger pagado_at no funciona con search_path vacío'; END IF;
  INSERT INTO public.reserva_bloque (reserva_id, titulo, fecha, hora_inicio, hora_fin, duracion_minutos)
  VALUES ('30000000-0000-4000-8000-000000000003', 'Sesión 2', (now() AT TIME ZONE 'Atlantic/Canary')::date + 201, '10:00', '12:00', 120);
  RAISE NOTICE 'OK P04 reservas manuales, pagos (trigger pagado_at) y sesiones de pack';

  INSERT INTO public.bloqueo_horario (fecha, hora_inicio, hora_fin, motivo)
  VALUES ((now() AT TIME ZONE 'Atlantic/Canary')::date + 202, '22:00', '24:00', 'hasta medianoche');
  UPDATE public.bloqueo_horario SET deleted_at = now() WHERE motivo = 'hasta medianoche';
  RAISE NOTICE 'OK P05 bloqueos hasta medianoche (24:00) y borrado lógico';

  INSERT INTO public.finanza_movimiento (tipo, categoria, concepto, importe, fecha, reserva_id)
  VALUES ('ingreso', 'sesion', 'Pago', 31, current_date, '30000000-0000-4000-8000-000000000003');
  UPDATE public.finanza_movimiento SET importe = 32 WHERE concepto = 'Pago';
  DELETE FROM public.finanza_movimiento WHERE concepto = 'Pago';
  RAISE NOTICE 'OK P06 finanzas';

  INSERT INTO public.imagen (admin_id, titulo, url_imagen) VALUES (auth.uid(), 'Nueva', 'https://example.com/n.jpg');
  INSERT INTO public.visuals_imagen (url_imagen) VALUES ('https://example.com/v.jpg');
  UPDATE public.visuals_imagen SET activo = false WHERE url_imagen = 'https://example.com/v.jpg';
  UPDATE public.contacto SET leido = true;
  RAISE NOTICE 'OK P07 galería, visuals y mensajes';

  INSERT INTO storage.objects (bucket_id, name) VALUES ('galeria', 'a.png'), ('garage-visuals', 'b.png');
  UPDATE storage.objects SET metadata = '{}' WHERE name = 'b.png';
  DELETE FROM storage.objects WHERE name IN ('a.png', 'b.png');
  RAISE NOTICE 'OK P08 subir, cambiar y borrar archivos en Storage';

  INSERT INTO public.audit_log (admin_id, accion, entidad) VALUES (auth.uid(), 'test', 'test');
  RAISE NOTICE 'OK P09 registrar auditoría';
END $t$;
ROLLBACK;`;

// ───────────────────────── Escenario 1: orden recomendado
{
  const db = await freshDb();
  results.push('── Escenario 1: 023 → 022 → pruebas → 024 → pruebas (esquema de producción)');
  const v = (await db.query('select version() v')).rows[0].v;
  results.push(`   motor: ${v.split(' on ')[0]}`);
  await step(db, 'Aplicar 023_admin_allowlist.sql', repo('supabase/migrations/023_admin_allowlist.sql'));
  await step(db, 'Aplicar 022_hardening_reservas_rls.sql', repo('supabase/migrations/022_hardening_reservas_rls.sql'));
  const norm = await db.query(`select count(*)::int n from reserva where hora_fin = time '24:00'`);
  results.push(`${norm.rows[0].n === 1 ? '✔' : '✖'} Normalización 00:00 → 24:00 de la reserva histórica (${norm.rows[0].n} fila)`);
  if (norm.rows[0].n !== 1) failures++;
  await step(db, 'Script 022_023_verificacion.sql', repo('supabase/tests/022_023_verificacion.sql'), { expectNotice: 'TODAS LAS PRUEBAS 022/023 SUPERADAS' });
  await step(db, 'Permisos completos de la cuenta legítima', ADMIN_PERMS, { expectNotice: 'OK P09' });
  await step(db, 'Aplicar 024_public_writes_server_only.sql', repo('supabase/migrations/024_public_writes_server_only.sql'));
  await step(db, 'Script 024_verificacion.sql', repo('supabase/tests/024_verificacion.sql'), { expectNotice: 'TODAS LAS PRUEBAS 024 SUPERADAS' });
  await step(db, 'Permisos de la cuenta legítima tras la 024', ADMIN_PERMS, { expectNotice: 'OK P09' });
  await step(db, 'Reasignación de servicios (tras migraciones)', repo('supabase/maintenance/reasignar_servicios_admin_huerfano.sql'), { expectNotice: 'OK: 15 servicios reasignados' });
  const re = await db.query(`select count(*)::int n from servicio where admin_id = '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a'`);
  const rs = await db.query(`select count(*)::int n from reserva`);
  results.push(`${re.rows[0].n === 42 && rs.rows[0].n === 69 ? '✔' : '✖'} Tras reasignar: la cuenta legítima tiene ${re.rows[0].n} servicios; reservas intactas: ${rs.rows[0].n}`);
  await step(db, 'Reasignación repetida', repo('supabase/maintenance/reasignar_servicios_admin_huerfano.sql'), { expectError: 'se esperaban 15' });
  await step(db, 'Borrado opcional del huérfano con FK RESTRICT', `BEGIN; DELETE FROM public.administrador WHERE id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1'; ROLLBACK;`);
  await step(db, 'Borrar el admin legítimo con servicios está bloqueado (RESTRICT)', `BEGIN; DELETE FROM public.administrador WHERE id = '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a'; COMMIT;`, { expectError: 'violates RESTRICT setting' });
  await db.close();
}

// ───────────────────────── Escenario 2: rollback completo y reaplicación
{
  const db = await freshDb();
  results.push('── Escenario 2: rollback 024 → 022 → 023 y reaplicación');
  const before = await policySnapshot(db);
  await step(db, 'Aplicar 023', repo('supabase/migrations/023_admin_allowlist.sql'));
  await step(db, 'Aplicar 022', repo('supabase/migrations/022_hardening_reservas_rls.sql'));
  await step(db, 'Aplicar 024', repo('supabase/migrations/024_public_writes_server_only.sql'));
  await step(db, 'Rollback 024', repo('supabase/rollback/024_rollback.sql'));
  await step(db, 'Rollback 022', repo('supabase/rollback/022_rollback.sql'));
  await step(db, 'Rollback 023', repo('supabase/rollback/023_rollback.sql'));
  const after = await policySnapshot(db);
  const norm = (rows) => [...new Set(rows)].sort();
  const missing = norm(before).filter((p) => !after.includes(p));
  const extra = norm(after).filter((p) => !before.includes(p));
  // Las políticas duplicadas de cliente_nota/bloqueo eran redundantes con *_admin_all (ALL true)
  const harmlessMissing = missing.filter((p) => !/cliente_nota\|(DELETE|INSERT|UPDATE|SELECT)\|authenticated|bloqueo_horario\|ALL\|authenticated\|\(auth\.uid\(\)/.test(p));
  results.push(`${harmlessMissing.length === 0 && extra.length === 0 ? '✔' : '✖'} Estado de políticas tras el rollback equivalente al original (faltan solo redundantes: ${missing.length - harmlessMissing.length}; distintas: ${harmlessMissing.length + extra.length})`);
  if (harmlessMissing.length || extra.length) { failures++; results.push('   ' + [...harmlessMissing, ...extra.map((x) => '+' + x)].join('\n   ')); }
  const sp = await db.query(`select count(*)::int n from pg_namespace where nspname = 'private'`);
  results.push(`${sp.rows[0].n === 0 ? '✔' : '✖'} Esquema private eliminado por el rollback`);
  await step(db, 'Reaplicar 023 tras rollback', repo('supabase/migrations/023_admin_allowlist.sql'));
  await step(db, 'Reaplicar 022 tras rollback', repo('supabase/migrations/022_hardening_reservas_rls.sql'));
  await step(db, 'Script 022_023 tras reaplicar', repo('supabase/tests/022_023_verificacion.sql'), { expectNotice: 'TODAS LAS PRUEBAS 022/023 SUPERADAS' });
  await step(db, 'Reaplicar 024 tras rollback', repo('supabase/migrations/024_public_writes_server_only.sql'));
  await step(db, 'Script 024 tras reaplicar', repo('supabase/tests/024_verificacion.sql'), { expectNotice: 'TODAS LAS PRUEBAS 024 SUPERADAS' });
  await db.close();
}

// ───────────────────────── Escenario 3: orden inverso y reasignación sobre el estado actual
{
  const db = await freshDb();
  results.push('── Escenario 3: reasignación sobre el esquema actual (sin migraciones) y orden 022 → 023');
  await step(db, 'Reasignación de servicios sobre el estado actual', repo('supabase/maintenance/reasignar_servicios_admin_huerfano.sql'), { expectNotice: 'OK: 15 servicios reasignados' });
  await step(db, 'Aplicar 022 primero', repo('supabase/migrations/022_hardening_reservas_rls.sql'));
  await step(db, 'Aplicar 023 después', repo('supabase/migrations/023_admin_allowlist.sql'));
  await step(db, 'Script 022_023 (orden inverso)', repo('supabase/tests/022_023_verificacion.sql'), { expectNotice: 'TODAS LAS PRUEBAS 022/023 SUPERADAS' });
  await step(db, 'Reaplicar 023 (idempotencia)', repo('supabase/migrations/023_admin_allowlist.sql'));
  await step(db, 'Reaplicar 022 (idempotencia)', repo('supabase/migrations/022_hardening_reservas_rls.sql'));
  await db.close();
}

// ───────────────────────── Escenario 4: la 023 aborta si no hay ningún admin válido
{
  const db = await freshDb();
  results.push('── Escenario 4: salvaguardas');
  await db.exec(`UPDATE auth.users SET deleted_at = now() WHERE id = '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a';`);
  await step(db, '023 sin ningún administrador válido', repo('supabase/migrations/023_admin_allowlist.sql'), { expectError: 'ningún registro de administrador' });
  await db.exec(`UPDATE auth.users SET deleted_at = NULL WHERE id = '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a';`);
  await db.exec(`INSERT INTO reserva (servicio_id, nombre, email, telefono, fecha_reserva, hora_inicio, hora_fin, duracion_minutos, estado, origen) VALUES ('20000000-0000-4000-8000-000000000002','Rota','r@example.com','600000777', current_date + 5, NULL, NULL, 60, 'pendiente', 'web');`);
  await step(db, '022 con una reserva activa sin horas', repo('supabase/migrations/022_hardening_reservas_rls.sql'), { expectError: 'reservas activas con horas nulas' });
  const pol = await db.query(`select count(*)::int n from pg_policies where policyname = 'reserva_public_insert' and with_check = 'true'`);
  results.push(`${pol.rows[0].n === 1 ? '✔' : '✖'} Tras abortar, la 022 no dejó cambios a medias (transacción revertida)`);
  await db.close();
}

console.log(results.join('\n'));
console.log(`\nRESULTADO: ${failures === 0 ? 'TODO CORRECTO' : failures + ' FALLO(S)'}`);
process.exit(failures ? 1 : 0);
