# Auditoría integral v1 — Garage Studios Web (noviembre 2026)

Documento operativo para continuar el trabajo en sesiones posteriores. Resume
qué se auditó, qué se corrigió en la rama `aaos/garage-studios-auditoria-profu-20261116`
y qué queda pendiente de decisión del propietario.

## Decisiones técnicas tomadas

| Decisión | Motivo |
|---|---|
| Las Server Actions públicas y de estado devuelven `{ ok, error }` (`src/lib/action-result.ts`) en lugar de lanzar. | En producción Next.js sustituye el mensaje de un `throw` dentro de una Server Action por un texto genérico: el cliente nunca veía "Ese horario ya no está disponible". |
| El fin de sesión a medianoche se guarda como `TIME '24:00'` (`minutesToTime`). | Con `'00:00'`, `fecha + hora_fin` era el inicio del mismo día y la restricción `reserva_no_overlap` (tsrange) fallaba con error 22000. Postgres acepta `24:00` y lo interpreta como la medianoche siguiente. `formatTime()` lo muestra como `00:00`. |
| Toda lógica de "hoy"/"ahora" usa `Atlantic/Canary` (`src/lib/dates.ts`). | El servidor corre en UTC; en verano la isla va una hora por delante. |
| Lecturas públicas con cliente Supabase sin cookies (`src/lib/supabase/public.ts`). | Permite prerenderizar `/`, `/servicios`, `/reservas`, `/galeria` y `/visuals` con ISR de 1 h e invalidación por `revalidatePath` desde el panel. |
| Validación de servidor obligatoria en reservas (`src/lib/reservation-rules.ts`). | Horario de apertura, fecha no pasada, hora no pasada, formato y longitudes no dependían del navegador. |
| Escape HTML en todos los correos (`src/lib/html.ts`). | Nombre, notas y asunto se interpolaban crudos en el buzón del administrador. |
| Términos de búsqueda saneados antes de `.or()`/`.ilike()` (`src/lib/search.ts`). | Comas y paréntesis alteraban la gramática de filtros PostgREST. |
| Vídeo de rayos solo en ≥1280 px y al entrar en viewport; intro con MP4 primero y omitida con `saveData`. | Se descargaban 18 MB de vídeo también en móvil. |
| Pruebas unitarias con `node --test` (sin dependencias nuevas). | Scripts `npm test` y `npm run typecheck`. |

## Pendiente de decisión del propietario (no aplicado)

> **Actualización 16-nov-2026:** los puntos 1–4 se cerraron en código en
> `docs/cierre-pendientes-v1.md` (lista privada de administradores, migración 023,
> 022 revisada con pruebas y rollback en `docs/migraciones-022-023.md`, plan de medios).
> Se midió que el registro de Auth está **abierto**.

1. **Aplicar `supabase/migrations/022_hardening_reservas_rls.sql`** en staging y luego en producción. Corrige: políticas anon `WITH CHECK (true)` (hoy cualquiera con la anon key puede insertar reservas "pagadas" o con horas nulas que bloquean la agenda), audit_log inmutable, FKs sin borrado en cascada de reservas, RPC para el `.ics`, índices.
2. **Comprobar en Supabase Auth que el registro de usuarios está desactivado.** Cualquier usuario autenticado es administrador (`TO authenticated`).
3. **Confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel** (no se pudo verificar). Sin ella, el enlace `.ics` de los emails solo funcionará tras aplicar la migración 022.
4. **Recodificar los vídeos** (`logo3d.webm` 9,3 MB, `logo3d.mp4` 5,4 MB, `rayos.webm` 9,1 MB, `video_hero_visuals.webm` 7,7 MB) a ≤1 MB cada uno y convertir los GIF de `public/icons/services` (0,6–1,8 MB) a WebP animado o Lottie. No hay ffmpeg/sharp en el entorno.
5. **Rate limit en memoria** (`src/lib/rate-limit.ts`): en Vercel cada instancia tiene su propio contador. Si hay abuso real, Upstash Ratelimit (coste externo).
6. **Turnstile fail-open**: si Cloudflare no responde, el formulario se acepta. Decisión de negocio actual; alternativa: rechazar con mensaje.
7. **Clientes duplicados**: el flujo público crea un cliente nuevo por reserva (RLS impide buscar). Un cliente repetido queda sin vincular (índice único de email/teléfono) y el admin usa "Vincular reservas antiguas". Solución limpia: RPC `SECURITY DEFINER` de búsqueda/creación.
8. **Archivos candidatos a borrar** (no borrados por requerir aprobación): `src/components/SpotifyProductions.tsx` y `src/components/admin/AdminAlerts.tsx` (sin uso), `process-og.js` (script puntual), `public/images/*GOOGLE-MAP*` y `public/images/G VISUALS/*` (≈40 MB de originales que no se sirven).
9. **Intro de 1,6 s**: se mantiene por identidad de marca; el brief pide evitar retrasos artificiales. Quitarla es decisión de producto.

## Cómo verificar

```bash
npm run lint        # 0 problemas
npm run typecheck   # sin errores
npm test            # 41 pruebas
npm run build       # páginas públicas estáticas (○) con revalidate 1h
```

Para el servidor local hacen falta `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.local`, no versionado).

## Plan de publicación y recuperación

1. Revisar el diff de la rama y los informes en AI Agency OS.
2. Desplegar la rama como *preview* en Vercel y repetir las capturas/medidas en móvil y escritorio.
3. Aplicar la migración 022 en una rama de Supabase o en staging; comprobar reservas públicas, confirmación por email y enlace `.ics`.
4. Integrar en `main` por avance rápido y desplegar.
5. Recuperación: `git revert` del merge (o *rollback* del deployment en Vercel). La migración 022 incluye su bloque de rollback; el código es compatible con el esquema anterior salvo la RPC del `.ics` (que solo se usa si falta la service role).
