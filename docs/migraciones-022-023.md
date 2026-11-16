# Migraciones 022 y 023 — procedimiento de aplicación, pruebas y rollback

Estado a 16-nov-2026: **ninguna está aplicada en producción**. Las dos son
transaccionales (si falla una comprobación no se aplica nada) e
independientes entre sí. Orden recomendado: **023 → 022**.

| Migración | Qué corrige | Riesgo si no se aplica |
|---|---|---|
| `023_admin_allowlist.sql` | Solo las cuentas de `public.administrador` acceden a los datos del panel y a Storage (`private.is_admin()`); `audit_log` inmutable. | **Crítico.** Con el registro abierto, cualquiera que se registre lee y modifica reservas, clientes, finanzas y archivos. |
| `022_hardening_reservas_rls.sql` | La anon key pública solo puede crear solicitudes `pendiente` con el precio, la duración y el horario reales; ninguna reserva cae sobre un bloqueo o un pack; FKs sin borrado en cascada; RPC del `.ics` sin datos personales. | Alto. Con la anon key se pueden crear reservas "confirmadas", con precio 0 o que bloqueen el día entero. |

## 0. Medida inmediata (sin migración, 1 minuto)

Supabase → **Authentication → Sign In / Providers → desactivar "Allow new users to sign up"**.
Comprobado el 16-nov-2026 con `GET /auth/v1/settings`: `disable_signup: false` (registro **abierto**).
Hoy solo existe una cuenta (`admin@garagestudios.es`), así que aún no hay intrusos registrados.
Recomendado además: activar *Leaked password protection* (aviso del linter de Supabase).

## 1. Preparar un entorno de pruebas (no producción)

Opción A, **rama de Supabase** (de pago, Supabase Pro): `Branches → Create branch`.
Opción B, **proyecto de staging** gratuito: restaurar el esquema con las migraciones 001–021
(o un volcado sin datos personales).

En el entorno de pruebas debe existir al menos una cuenta de Auth que esté en `administrador`
(la 023 lo comprueba y aborta si no la hay).

## 2. Aplicar y probar en el entorno de pruebas

1. SQL Editor → pegar `supabase/migrations/023_admin_allowlist.sql` → Run.
2. SQL Editor → pegar `supabase/migrations/022_hardening_reservas_rls.sql` → Run.
3. SQL Editor → pegar `supabase/tests/022_023_verificacion.sql` → Run.
   Debe terminar con `TODAS LAS PRUEBAS 022/023 SUPERADAS` (50 comprobaciones: rol anónimo,
   usuario registrado ajeno a la lista, administrador y cuenta baneada). Todo se deshace con
   `ROLLBACK`.
4. Advisors → Security: deben desaparecer `function_search_path_mutable`. Quedan, aceptados a
   propósito: `get_occupied_slots` y `get_reserva_by_calendar_token` ejecutables por anon (solo
   devuelven horas y nombre de servicio) y `btree_gist` en `public`.
5. Vercel *preview* apuntando al entorno de pruebas: crear una reserva desde la web, confirmarla
   en el panel, abrir el enlace `.ics` del email, crear y borrar un bloqueo, subir y borrar una
   imagen, exportar a Excel. Ver `docs/cierre-pendientes-v1.md` → "Validación del panel".

## 3. Producción (solo con autorización expresa del propietario)

1. Desactivar el registro público (paso 0) si no se hizo ya.
2. Backup: Database → Backups (o `pg_dump` del esquema `public`).
3. Hora valle (de madrugada; la web recibe pocas reservas). Aplicar 023 y, después, 022.
4. Comprobación rápida (solo lectura):
   ```sql
   select tablename, policyname, roles, qual from pg_policies
   where schemaname in ('public','storage') order by 1, 2;
   ```
   Toda política para `authenticated` debe contener `is_admin()`.
5. Entrar al panel con la cuenta de administrador y repetir el recorrido del paso 2.5.
   Hacer una reserva real de prueba desde la web y cancelarla después desde el panel.

## 4. Rollback

| Síntoma | Acción |
|---|---|
| El panel no muestra datos o da "No autorizado" a la cuenta buena | Comprobar que su id está en `administrador` y no está baneada. Si no se resuelve: `supabase/rollback/023_rollback.sql` (**reabre el agujero**: solo con el registro desactivado). |
| La web pública no puede crear solicitudes (error RLS 42501 en los logs) | `supabase/rollback/022_rollback.sql`. La app es compatible con el esquema anterior. |
| Fallo de código tras desplegar | Rollback del deployment en Vercel o `git revert`. La app funciona con y sin las migraciones: la comprobación de la lista consulta la tabla directamente. |

Los dos rollbacks son transaccionales. No revierten, a propósito, la normalización `00:00 → 24:00`
ni (salvo bloque opcional) el `ON DELETE RESTRICT`: volver atrás en eso reintroduce los errores.

## 5. Gestión de administradores tras la 023

- Alta: Authentication → Users → **Add user** y, en el SQL Editor:
  `insert into public.administrador (id, email, nombre) select id, email, 'Nombre' from auth.users where email = '…';`
- Baja inmediata: banear o borrar la cuenta en Auth (la función lo comprueba en cada consulta).
- Nadie puede darse de alta desde la web: no hay política de escritura sobre `administrador` y se
  eliminó `ensureAdminExists`, que insertaba ahí a cualquier usuario autenticado.
- Pendiente de decisión: la fila huérfana `admin@garagestudios.com` (sin cuenta en Auth, dueña de
  15 servicios) no da acceso a nadie, pero conviene reasignar sus servicios a la cuenta real y
  borrarla:
  ```sql
  update public.servicio set admin_id = '0dc87e42-370c-49ae-b1fa-3e61fbea1e3a'
  where admin_id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1';
  delete from public.administrador where id = '9326d456-0ce5-49b0-b6e1-04d4b80283b1';
  ```
