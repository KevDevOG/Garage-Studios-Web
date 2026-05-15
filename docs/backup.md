# Guía de Backups y Seguridad de Datos 💾

Garage Studios Web maneja información crítica para el negocio. Esta guía explica cómo asegurar que los datos estén protegidos y cómo recuperarlos en caso de necesidad.

## 1. Exportaciones Administrativas (Recomendado)
La forma más sencilla de tener un backup legible es usar el módulo de exportación del Panel Admin:
- Ve a **Admin > Exportaciones**.
- Descarga semanalmente los archivos Excel de:
  - **Reservas**: Historial de citas.
  - **Clientes**: Base de datos del CRM.
  - **Finanzas**: Registro contable.

## 2. Backup de la Base de Datos (Supabase)
Supabase realiza backups diarios automáticos de la base de datos PostgreSQL:
- **Retención**: 7 días (Plan gratuito) / 30 días (Plan Pro).
- **Cómo restaurar**: Accede al Dashboard de Supabase > Project Settings > Backups.
- **Exportación SQL**: Puedes usar la herramienta `pg_dump` para realizar un backup manual completo:
  ```bash
  pg_dump -h db.tu_id_proyecto.supabase.co -U postgres > backup_estudio.sql
  ```

## 3. Almacenamiento de Imágenes (Storage)
Las imágenes de la galería y servicios se guardan en Supabase Storage:
- Se recomienda tener una copia local de las imágenes originales subidas.
- No hay backup automático de archivos individuales en el plan gratuito; se recomienda descargar los cubos (`buckets`) de forma periódica.

## 4. Configuración del Entorno (`.env`)
El archivo `.env.local` es el corazón de la conexión entre la web y los servicios:
- **IMPORTANTE**: No compartas este archivo ni lo subas a GitHub.
- Ten una copia de seguridad en un gestor de contraseñas de las claves de:
  - Supabase URL / Anon Key / Service Role.
  - Resend API Key.
  - Turnstile Keys.

## 5. Auditoría
El sistema registra cada acción administrativa en la tabla `audit_log`. Si sospechas de un cambio no deseado:
- Revisa **Admin > Auditoría**.
- Identifica quién realizó el cambio y cuándo.
- El sistema usa **Soft Delete** (borrado lógico), lo que significa que los registros "borrados" siguen en la base de datos con una fecha en `deleted_at`. Para recuperar un registro, solo hay que limpiar ese campo en la base de datos.

---
*En caso de error crítico, contactar con el desarrollador o soporte de Supabase/Vercel.*
