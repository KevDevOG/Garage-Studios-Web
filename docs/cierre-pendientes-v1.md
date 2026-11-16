# Cierre de pendientes de seguridad y estabilidad (16-nov-2026)

Continuación de `docs/auditoria-v1.md`. Rama `aaos/apruebo-las-mejoras-realizadas-20261116`.
Nada se ha aplicado en producción ni se ha publicado.

## Estado por punto

| # | Punto | Estado | Detalle |
|---|---|---|---|
| 1 | Registro público de Auth | **ABIERTO en producción** (`disable_signup: false`, medido por `GET /auth/v1/settings`) | Cerrarlo es una acción de 1 minuto en el panel de Supabase (ver `docs/migraciones-022-023.md` §0). No lo he cambiado: es configuración de producción. |
| 2 | Permisos y cuentas | Auditado | 1 cuenta en Auth (`admin@garagestudios.es`, confirmada, último acceso 19-oct-2026). `administrador` tiene 2 filas: la anterior y `admin@garagestudios.com`, **huérfana** (sin cuenta, dueña de 15 servicios, no da acceso a nadie). Todas las políticas del panel eran `TO authenticated USING (true)` (también Storage), y `ensureAdminExists` daba de alta como administrador a cualquier usuario con sesión. |
| 3 | Lista privada de administradores | **Implementada** | BD: migración 023 (`private.is_admin()` en todas las políticas, lista sin escritura vía API, revocación inmediata baneando la cuenta). App: `src/lib/admin-allowlist.ts` en proxy, login y todas las Server Actions del panel. Sin variables de entorno nuevas. |
| 4 | Migración 022 | Revisada, corregida, con pruebas y rollback | Ver abajo y `docs/migraciones-022-023.md`. |
| 5 | Reservas simultáneas, solapamientos y accesos | Revisado y reforzado | Ver abajo. |
| 6 | `SUPABASE_SERVICE_ROLE_KEY` | Verificado en el código y en el build | Solo la lee `src/lib/supabase/public.ts` (ahora con `import "server-only"`), la usan una Server Action y un Route Handler, y no aparece en `.next/static`. Pruebas automáticas que lo vigilan. **No verificado:** si existe en Vercel (requiere permiso para listar variables). |
| 7 | Enlaces ICS | Reforzado | Ver abajo. |
| 8 | Responsive | Probado: 8 páginas × 6 anchos (320–1440) | 2 fallos corregidos. Ver abajo. |
| 9 | Validación del panel | Procedimiento preparado | Ver abajo. No ejecutado: requiere entorno de pruebas y que el propietario inicie sesión. |
| 10 | Vídeos y GIF | Estudiado, script listo | Ver abajo. No ejecutado: no hay ffmpeg en la máquina. |

## 4. Migración 022: cambios de la revisión

- **Error corregido en la propia propuesta**: el bloque de `audit_log` se movió a la 023 (necesita `is_admin()`); si no, aplicar 022 después de 023 habría reabierto la auditoría a cualquier usuario autenticado.
- Política anon de `reserva`: servicio activo, **precio y duración del servicio reales**, intervalo coherente con la duración (`24:00` = 86 400 s), consentimiento de privacidad, campos internos nulos y fecha entre hoy y +730 días. Comprobado en solo lectura contra producción: las reservas web actuales cumplen las condiciones (las antiguas que no las cumplen son de servicios cuyo precio cambió después; la política solo se evalúa al insertar).
- Nuevo trigger `trg_reserva_check_agenda_overlap`: una reserva no puede crearse ni moverse sobre un bloqueo manual o una sesión de pack (antes solo lo comprobaba la app y la anon key se lo saltaba). Devuelve 23P01, que la app ya muestra como "horario no disponible".
- Revisión independiente (agency-quality) incorporada: lock por fecha en los tres caminos de la agenda, comparación de extremos en lugar de `tsrange` (una fila histórica invertida no bloquea el día), límites de longitud en `cliente`, postflight de la 023 ampliado (escritura en Storage, políticas anon inesperadas, tablas sin RLS) y `signOut({ scope: "local" })` al rechazar un login.
- `imagen.admin_id` también pasa a `ON DELETE RESTRICT`; normalización `00:00 → 24:00` también en bloques y bloqueos; postflight dentro de la transacción.
- RPC del `.ics` sin datos personales y con caducidad (ver punto 7).
- Datos de producción comprobados en solo lectura: 84 reservas, 1 con fin `00:00` (se normaliza), 0 activas con horas inválidas, 0 tokens nulos o duplicados, 0 importes negativos.

## 5. Concurrencia y solapamientos

| Caso | Protección | Atómica |
|---|---|---|
| Dos reservas en el mismo hueco (doble clic, dos personas a la vez) | `EXCLUDE reserva_no_overlap` (020), comprobado con las pruebas A28/A29 | Sí |
| Reserva sobre un bloqueo manual o un pack | Trigger nuevo (022) + comprobación previa en la app; reserva, bloqueo y sesión de pack toman el mismo `pg_advisory_xact_lock` por fecha | Sí. Si se guardan a la vez, la reserva espera al bloqueo y lo ve. Un bloqueo creado **después** sobre una reserva existente se permite a propósito (decisión del panel). |
| Reserva fuera de horario o en hora pasada | Validación de servidor (`reservation-rules.ts`) | La anon key permite saltarla con fechas futuras; el horario de apertura no está en la BD (ver riesgos). |
| Admin mueve una reserva sobre otra | EXCLUDE + `validateSlotAvailable(…, excluir propia)` | Sí |
| Accesos no autorizados | 023 (BD) + proxy/login/Server Actions (app). Pruebas N01–N13 y C01 | — |
| Bloqueos con horas incoherentes | `validateBlockInput` (nuevo, con pruebas) + `CHECK` de la 022 | Sí |

**Riesgo residual:** con la anon key pública se puede seguir enviando solicitudes `pendiente`
saltándose Turnstile y el rate limit (las políticas solo garantizan que sean coherentes). La
solución completa es que las inserciones públicas pasen por la service role en el servidor y
revocar el INSERT de anon. Requiere confirmar la variable en Vercel; es la siguiente mejora
recomendada.

## 7. Enlaces ICS

- El token es un UUID v4 aleatorio (122 bits) con índice único: no es enumerable.
- **Minimización**: el evento ya no incluye el nombre del cliente; la RPC solo devuelve fecha, horas y servicio.
- **Caducidad**: el enlace deja de funcionar 30 días después de la sesión (en la RPC y en la ruta, con la misma regla y probado).
- Reservas canceladas, rechazadas o borradas: 404, con el mismo mensaje que un token inexistente (no revela si existe).
- Cabeceras `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`; rate limit de 30/h por IP.
- `escapeIcs` impide inyectar propiedades con saltos de línea en el nombre del servicio.

## 8. Responsive (Playwright, `next start` local, sin enviar formularios)

Páginas: `/`, `/servicios`, `/reservas`, `/galeria`, `/visuals`, `/contacto`, `/admin/login`,
`/privacidad`. Anchos: 320, 375, 414, 768, 1024 y 1440 px, con desplazamiento completo para
disparar animaciones y carga diferida.

- **Corregido:** entre 768 y 1023 px la navegación de escritorio no cabía: 12 px de scroll
  horizontal en todas las páginas, los enlaces se montaban sobre el botón Visuals y el logo
  principal quedaba en 1 px de ancho. Ahora el menú hamburguesa cubre hasta 1023 px y la
  navegación de escritorio aparece desde 1024 px, idéntica a antes (capturas comprobadas a 768,
  1024 y 1280 px; menú abierto a 768 px con sus 5 enlaces).
- **Corregido:** los puntos del carrusel de `/visuals` en móvil medían 6×6 px. El punto visible es
  idéntico; la zona táctil pasa a 24×24 px.
- Sin desbordamiento en 320/375/414/1024/1440 (en `/servicios` a 320 px solo con la barra de
  scroll de escritorio; en un móvil real cabe).
- Aceptado como diseño: etiquetas de 9–10 px en mayúsculas (`Visuals`, categorías, "60 min").
- Los 404 de consola son los scripts de Vercel Analytics, que solo existen en Vercel.

## 9. Validación del panel administrativo (sin contraseñas por chat)

**Entorno**: proyecto de staging o rama de Supabase con las migraciones 022 y 023 aplicadas
(nunca producción para las pruebas de escritura) y un *preview* de Vercel, o `npm run start`
local, apuntando a él. Sin `RESEND_API_KEY` real en staging, para no enviar correos a clientes.

**Credenciales**:
1. El propietario crea la cuenta de pruebas en staging (Authentication → Add user, con la
   contraseña en su gestor de contraseñas) y la añade a `administrador` (SQL en
   `docs/migraciones-022-023.md` §5).
2. Claude abre el navegador de Playwright en `/admin/login` y **el propietario escribe la
   contraseña directamente en esa ventana**. La contraseña nunca pasa por el chat ni por
   archivos. La sesión vive solo en ese navegador y se cierra al terminar (`logout`).

**Recorrido** (Claude lo ejecuta y captura evidencias en `.playwright-mcp/`, ya ignorado por Git):
- Dashboard, calendario (crear reserva manual, moverla, intentar moverla sobre un bloqueo → debe
  rechazarse, crear y borrar un bloqueo hasta las 00:00), packs (añadir y borrar sesión).
- Estados de reserva: confirmar, cancelar, completar, marcar pago parcial y total.
- Clientes (alta, nota, vincular reservas), finanzas (alta, edición, borrado, informe imprimible).
- Galería y Visuals (subir, editar, desactivar y borrar imagen), servicios (crear, editar, desactivar).
- Exportaciones a Excel y auditoría (cada acción anterior debe aparecer, sin poder editarse).
- Negativas: una segunda cuenta de staging **no** incluida en la lista no puede entrar (mismo
  mensaje que contraseña incorrecta); banear la cuenta de pruebas expulsa del panel en la
  siguiente petición.
- Repetir el recorrido de lectura a 375 px y 1440 px.

En producción, tras aplicar las migraciones, solo un recorrido de **lectura** con la cuenta real,
iniciando sesión el propietario de la misma forma.

## 10. Vídeos y GIF (sin cambiar la estética)

Medido: los vídeos se codifican a mucha más resolución y bitrate del que se ve.

| Archivo | Hoy | Se muestra | Propuesta | Estimación |
|---|---|---|---|---|
| `videos/logo3d.mp4` / `.webm` (intro) | 1920×1080, 5,4 / 9,3 MB (5–9 Mbps) | caja de 176–256 px | 640×360, VP9 CRF 33 + H.264 CRF 24 | 0,2–0,5 MB cada uno |
| `videos/rayos.webm` (fondo de planes, ≥1280 px) | 1920×1080, 9,1 MB | opacidad 18 % bajo capa negra | 1280×720, VP9 CRF 38 | ~1 MB |
| `videos/video_hero_visuals.webm` | 1078×606, 7,5 MB (6 Mbps) | cabecera de /visuals | misma resolución, VP9 CRF 34 | 1–1,5 MB |
| `icons/services/*.gif` (7) | 640×640, 0,6–1,8 MB, con transparencia | 48–64 px | WebP animado 160×160 (conserva alfa y tiempos) | 40–120 KB cada uno |
| `public/rayos.mp4` | 6,6 MB | **no se usa** | borrar (requiere aprobación) | −6,6 MB |

Total estimado: de ~45 MB a ~4 MB. La intro animada se mantiene intacta (misma animación y
duración, solo menos píxeles invisibles).

Cómo:
1. Instalar ffmpeg (`winget install Gyan.FFmpeg`; acción del propietario, no es dependencia npm).
2. `node scripts/optimize-media.mjs --dry-run` y después sin `--dry-run`: genera `*.opt.webm`,
   `*.opt.mp4` y `*.webp` **junto a los originales, sin sobrescribirlos**.
3. Comparar lado a lado en la misma pantalla. Si algún vídeo pierde calidad, bajar su CRF 2–3
   puntos en el script y repetir.
4. Cambiar referencias: `IntroLoader.tsx`, `PlansLightningBackground.tsx`, `visuals/page.tsx` y,
   para los iconos (las rutas `.gif` están en la BD), que `ServiceIcon` sirva el `.webp` hermano
   de un `.gif` local y trate los `.webp` como animados (`unoptimized`). No se ha hecho aún porque
   sin los archivos generados las imágenes darían 404.
5. Borrar originales solo con aprobación.

## Pendiente de decisión del propietario

1. Cerrar el registro de Supabase Auth (inmediato, recomendado ya).
2. Aplicar 023 y 022 en staging, ejecutar las pruebas y después en producción (`docs/migraciones-022-023.md`).
3. Confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel (Production y Preview, sin prefijo `NEXT_PUBLIC_`).
4. Reasignar y borrar la fila huérfana `admin@garagestudios.com`.
5. Instalar ffmpeg para recodificar los medios; borrar `public/rayos.mp4`.
6. Activar *Leaked password protection* en Supabase Auth.
