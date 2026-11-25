# Panel de administración: "consola del estudio"

Guía breve para mantener coherente el panel (`/admin`). El código manda: los
tokens están en `src/app/globals.css` y las piezas en `src/components/admin/ui.tsx`.

## Reglas de diseño

- **Superficies grafito, texto papel, ámbar como señal.** Tokens `gs-*`
  (`bg-gs-canvas/surface/raised/sunken`, `border-gs-line`, `text-gs-paper/soft/faint`).
  El ámbar se reserva para la acción principal de cada pantalla, hoy/ahora y lo
  que espera respuesta (reserva pendiente, cobro pendiente, mensaje nuevo).
- **Un tono por significado** (`src/lib/status-colors.ts`): amber = espera
  acción, ok = resuelto/ingreso, info = intermedio, bad = anulado/gasto,
  neutral = sin carga. El color nunca es la única pista: siempre va con texto.
- **Tipografía:** Archivo en todo el panel, cifras tabulares. Títulos con
  `gs-display`. Mayúscula solo inicial; nada de versalitas ni texto < 12px.
- **Densidad:** cifras en `StatStrip` (una tira, no una tarjeta por cifra),
  tablas con las recetas `table.*` en escritorio y lista apilada en móvil.
- **Cada página:** `<Page>` + `<AdminNav title description actions>`. Vacíos
  con `EmptyState`, errores con `Notice`, formularios con `Field` + `FormActions`.
- **Campos:** el estilo base está en `@layer base` bajo `.gs-admin`, así que
  las utilidades (`w-auto`, `pl-9`…) sí pueden ajustarlos. 44px en táctil,
  40px con ratón.

## Calendario

- Geometría pura y probada en `src/lib/agenda.ts` (`tests/agenda.test.ts`).
- Vistas `?view=mes|semana|dia` (se aceptan `weekly`/`daily` antiguos) y `?fecha=`.
- **Pista del día** (`agenda/DayTrack`): el horario como una pista de
  multipistas; fuera de horario y bloqueos van tramados; el cabezal ámbar
  (`NowLine`) marca la hora del estudio.
- Solo las sesiones amplían la ventana horaria: un bloqueo de día completo se
  recorta a lo visible.
- Las canceladas y rechazadas no ocupan hueco en pistas ni rejillas; siguen
  en la lista, atenuadas.

## Datos y rendimiento

- **Nada de caché entre peticiones** para reservas, cobros o disponibilidad.
  Solo se deduplica dentro de una petición con `cache` de React:
  `getAdminSession`, `createClient`, lecturas de finanzas y de métricas de clientes.
- **Una consulta que falla nunca se pinta como cero o como "vacío"**: se
  muestra "Sin datos" o un `Notice` (panel, finanzas, calendario, por cobrar).
- Las páginas lanzan sus lecturas en un único `Promise.all`. La validación de
  sesión va en esa misma ronda y se comprueba antes de pintar.
- El proxy solo consulta la sesión en `/admin`; la web pública no la usa.
- "Por cobrar" = reservas confirmadas o completadas con pago pendiente o
  parcial; importe = precio − pagado (nunca negativo). Mismo criterio en
  Panel, Calendario y Finanzas.

## Pendiente conocido

- La sesión se valida dos veces por página (proxy y página, ~170 ms cada una).
  No se ha unificado a propósito: mientras las migraciones 022/023 no estén
  aplicadas, la lista de administradores de la app es la barrera real.
- `getClientes` devuelve como máximo 100 clientes y `getAuditLogs` 200 registros.
- Componentes sin uso tras el rediseño (candidatos a borrar):
  `components/admin/AdminAlerts.tsx`, `components/ReservationStatusSelect.tsx`;
  acciones sin llamadores: `updateReservationPayment`, `rescheduleReservation`.
