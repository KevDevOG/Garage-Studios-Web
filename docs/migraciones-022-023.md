# Migraciones 023, 022 y 024 — aplicación, pruebas y rollback

Estado a 16-nov-2026: **ninguna está aplicada en producción**. Las tres son transaccionales
(si falla una comprobación no se aplica nada) y están **validadas contra PostgreSQL** (§2b).
Orden: **023 → 022 → 024**. La 024 exige antes `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

| Migración | Qué corrige | Riesgo si no se aplica |
|---|---|---|
| `023_admin_allowlist.sql` | Solo las cuentas de `public.administrador` acceden a los datos del panel y a Storage (`private.is_admin()`); `audit_log` inmutable. | **Crítico.** Con el registro abierto, cualquiera que se registre lee y modifica reservas, clientes, finanzas y archivos. |
| `022_hardening_reservas_rls.sql` | Solicitudes públicas coherentes (`pendiente`, precio y duración reales); ninguna reserva sobre un bloqueo o un pack (trigger + lock por fecha); FKs sin borrado en cascada; RPC del `.ics` sin datos personales. | Alto. Reservas "confirmadas", con precio 0 o que bloquean el día. |
| `024_public_writes_server_only.sql` | El rol anon ya no puede escribir: reservas y contacto solo entran por el servidor, tras Turnstile, rate limit y cuota por contacto. | Alto. Con la anon key pública se pueden enviar solicitudes saltándose el antispam. |

## 0. Medidas inmediatas (sin migración)

1. Supabase → **Authentication → Sign In / Providers → desactivar "Allow new users to sign up"**.
   Comprobado de nuevo el 16-nov-2026 con `GET /auth/v1/settings`: `disable_signup: false` (**abierto**).
   Solo existe la cuenta `admin@garagestudios.es`. Activar también *Leaked password protection*.
2. Vercel → proyecto `project-w9jbu` → Settings → Environment Variables → añadir
   `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys → `service_role`/secret),
   tipo **Sensitive**, entornos Production y Preview, **sin** prefijo `NEXT_PUBLIC_`.
   Comprobado el 16-nov-2026 (listado sin descifrar valores): **no existe**. Sin ella el enlace `.ics`
   necesita la 022 y la 024 no se puede aplicar.

## 1. Entorno de pruebas

- **Validación local ya hecha (§2b)**: PostgreSQL 18.6 (PGlite) con el esquema de producción.
- Antes de producción, recomendado además un *preview* de Vercel contra staging o una rama de
  Supabase para el recorrido del panel (`docs/cierre-pendientes-v1.md` §9).

## 2. Aplicar y probar en staging / rama

1. SQL Editor → `supabase/migrations/023_admin_allowlist.sql` → Run.
2. SQL Editor → `supabase/migrations/022_hardening_reservas_rls.sql` → Run.
3. SQL Editor → `supabase/tests/022_023_verificacion.sql` → `TODAS LAS PRUEBAS 022/023 SUPERADAS`
   (50 comprobaciones). Se ejecuta **antes** de la 024: sus pruebas positivas de anon dejan de
   tener sentido después.
4. Con el código desplegado y la clave de servicio configurada: `024_public_writes_server_only.sql`
   y `supabase/tests/024_verificacion.sql` → `TODAS LAS PRUEBAS 024 SUPERADAS` (13 comprobaciones).
5. Advisors → Security: desaparece `function_search_path_mutable`. Aceptados a propósito:
   `get_occupied_slots` y `get_reserva_by_calendar_token` ejecutables por anon (solo horas y
   servicio) y `btree_gist` en `public`.

### 2b. Validación contra PostgreSQL real (hecha el 16-nov-2026)

`supabase/tests/pglite/`: esquema de producción extraído del catálogo (solo estructura),
entorno tipo Supabase (roles `anon`/`authenticated`/`service_role`, `auth.uid()`, `storage`) y
datos sintéticos con la misma forma (2 administradores, 15+27 servicios, 68 reservas…).

```bash
npm install --prefix <carpeta-temporal> --ignore-scripts @electric-sql/pglite@0.5.16
PGLITE_DIR=<carpeta-temporal> node supabase/tests/pglite/run.mjs
```

Resultado: **TODO CORRECTO** en 4 escenarios:
1. 023 → 022 → pruebas (50/50) → permisos completos de la cuenta legítima (lectura de las 12
   tablas y alta/edición/borrado en servicios, clientes y notas, reservas, pagos, packs,
   bloqueos hasta 24:00, finanzas, galería, visuals, mensajes, Storage y auditoría) → 024 →
   pruebas (13/13) → permisos de nuevo → reasignación de servicios.
2. Rollback 024 → 022 → 023: políticas equivalentes a las originales; reaplicación y pruebas OK.
3. Orden inverso 022 → 023 e idempotencia (reaplicar no falla).
4. Salvaguardas: la 023 aborta sin administrador válido; la 022 aborta con reservas activas sin
   horas y no deja cambios a medias.

La validación encontró y corrigió una expectativa errónea del script de pruebas (un
`ON DELETE RESTRICT` devuelve SQLSTATE 23001, no 23503). Limitaciones: PGlite es una sola
conexión (la concurrencia real del lock por fecha y del `EXCLUDE` no se puede simular) y
`auth`/`storage` son réplicas mínimas, no los de Supabase.

## 3. Producción (solo con autorización expresa del propietario)

1. Medidas del §0 hechas. Backup: Database → Backups.
2. Hora valle. Aplicar **023** y **022**. Comprobación de solo lectura:
   ```sql
   select tablename, policyname, roles, qual from pg_policies
   where schemaname in ('public','storage') order by 1, 2;
   ```
   Toda política para `authenticated` debe contener `is_admin()`.
3. Entrar al panel con la cuenta real (recorrido de lectura) y hacer una reserva real de prueba
   desde la web; cancelarla después.
4. Con el código de esta rama desplegado y la clave de servicio en Vercel: aplicar **024** y repetir
   la reserva de prueba (si falla con 42501, rollback 024 y revisar la variable).

## 4. Rollback

| Síntoma | Acción |
|---|---|
| El panel no muestra datos o da "No autorizado" a la cuenta buena | Comprobar que su id está en `administrador` y no está baneada. Si no se resuelve: `supabase/rollback/023_rollback.sql` (**reabre el agujero**: solo con el registro desactivado). |
| La web no puede crear solicitudes tras la 024 | `supabase/rollback/024_rollback.sql` y revisar `SUPABASE_SERVICE_ROLE_KEY`. |
| La web no puede crear solicitudes tras la 022 (42501 en logs) | `supabase/rollback/022_rollback.sql`. |
| Fallo de código tras desplegar | Rollback del deployment en Vercel o `git revert`. El código funciona con y sin migraciones. |

Todos los rollbacks son transaccionales y están validados (§2b). No revierten, a propósito, la
normalización `00:00 → 24:00` ni (salvo bloque opcional) el `ON DELETE RESTRICT`.

## 5. Administradores

- Alta: Authentication → Users → **Add user** y, en el SQL Editor:
  `insert into public.administrador (id, email, nombre) select id, email, 'Nombre' from auth.users where email = '…';`
- Baja inmediata: banear o borrar la cuenta en Auth (`is_admin()` lo comprueba en cada consulta).
- Nadie puede darse de alta desde la web.

### Reasignación de los 15 servicios de la fila huérfana

Script: `supabase/maintenance/reasignar_servicios_admin_huerfano.sql` (**no ejecutado en producción**).

Dependencias medidas (solo lectura): 15 servicios (14 activos), **68 reservas** y 18 clientes con
favorito apuntan a esos servicios; 0 finanzas, imágenes, notas o auditoría del huérfano; la cuenta
legítima está confirmada y sin banear. Hoy la FK `servicio → administrador` es **ON DELETE
CASCADE**: borrar la fila huérfana antes de reasignar borraría 15 servicios y 68 reservas. Por eso
el script solo cambia `servicio.admin_id`, comprueba recuentos antes y después y aborta ante
cualquier diferencia; el borrado de la fila es un paso aparte, comentado, que exige la 022
(RESTRICT). Validado en PGlite antes y después de las migraciones; repetirlo aborta sin cambios.
