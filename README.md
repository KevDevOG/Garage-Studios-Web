# Garage Studios Web

Aplicación web profesional para un estudio musical, desarrollada como proyecto final de **Desarrollo de Aplicaciones Web (DAW)** y utilizada como web real de negocio.

## 🔗 Demo
**[https://garagestudios.es](https://garagestudios.es)**

La aplicación está desplegada en **Vercel** con dominio propio y certificado SSL.

---

## 📋 Descripción General
Garage Studios Web es una plataforma Full-Stack diseñada para centralizar la presencia digital y la gestión operativa de un estudio de producción musical y audiovisual. 

Combina una **interfaz pública** de alto impacto visual con un avanzado **Panel de Administración (Backoffice)** privado que permite gestionar íntegramente el estudio: desde el catálogo de servicios y la galería, hasta un sistema complejo de reservas con cálculo de disponibilidad, CRM de clientes y control financiero detallado.

Se trata de un proyecto real aplicado a un negocio en funcionamiento, optimizado para ofrecer una experiencia premium tanto en escritorio como en dispositivos móviles.

---

## 🛠️ Stack Tecnológico
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **Backend & DB**: Supabase (PostgreSQL), Server Actions.
- **Autenticación**: Supabase Auth (Admin).
- **Almacenamiento**: Supabase Storage.
- **Comunicaciones**: Resend (Emails transaccionales), WhatsApp API.
- **Seguridad**: Cloudflare Turnstile (Anti-bot), Middleware, Row Level Security (RLS).
- **Herramientas**: ExcelJS (Reportes), Sonner (Notificaciones), Lucide React (Iconografía), Framer Motion (Animaciones).
- **Despliegue**: Vercel & GitHub (CI/CD).

---

## ✨ Funcionalidades

### 🌐 Parte Pública
- **Diseño Premium**: Interfaz oscura de alta gama con identidad visual propia, animaciones de revelado y efectos modernos (glassmorphism).
- **Sistema de Reservas**: Selección inteligente de servicio, fecha y hora con validación de disponibilidad en tiempo real.
- **Catálogo de Servicios**: Detalle de servicios con iconos animados locales y precios actualizados.
- **Galería Multimedia**: Visualización fluida de las instalaciones (El Estudio) y trabajos destacados.
- **Garage Visuals**: Sección dedicada a la producción audiovisual y videoclips.
- **Producciones**: Integración de reproductores de Spotify para mostrar el portfolio musical.
- **SEO & Legal**: Optimización técnica para buscadores y cumplimiento de RGPD (Aviso Legal, Privacidad, Cookies).
- **Contacto**: Formulario protegido contra spam con Cloudflare Turnstile.

### 🔐 Panel de Administración (Backoffice)
Acceso privado protegido para la gestión del estudio con las siguientes capacidades:
- **Dashboard App-Style**: Resumen ejecutivo con KPIs en tiempo real (Ingresos mes, Reservas hoy, Mensajes nuevos).
- **Buscador Global**: Acceso rápido a cualquier reserva o cliente desde un solo lugar.
- **Gestión de Calendario**: Vistas semanal y diaria de citas, incluyendo creación de bloqueos horarios manuales (festivos, mantenimiento).
- **CRM de Clientes**: Ficha comercial completa con historial de reservas, etiquetas personalizadas y notas internas privadas.
- **Finanzas Profesionales**: Control de ingresos reales (basados en pagos recibidos) y gastos categorizados con balance anual y mensual.
- **Auditoría**: Registro inalterable de acciones administrativas para trazabilidad total.
- **Exportaciones**: Generación de informes en formato Excel (.xlsx) para Reservas, Clientes, Finanzas y Contactos.
- **UX Adaptable**: Modo compacto de alta densidad y diseño 100% responsive para gestión desde el móvil.

---

## 📅 Sistema de Disponibilidad y Reservas
El motor de reservas garantiza una agenda sin conflictos:
- **Cálculo Dinámico**: La disponibilidad se calcula según la duración exacta de cada servicio y los solapamientos con otras citas.
- **Bloqueos Administrativos**: Los bloqueos horarios creados por el admin afectan instantáneamente a la disponibilidad pública.
- **Comunicación Automática**:
  - Email de confirmación, cancelación y finalización vía Resend.
  - Generación de archivos **.ics** para añadir la cita a calendarios externos (Google, Apple).
  - Enlaces de WhatsApp prellenados para comunicación directa con el cliente.

---

## 👤 Clientes / CRM
Gestión profesional de la base de datos de clientes:
- **Métricas de Fidelidad**: Identificación automática de clientes recurrentes y nuevos.
- **Ingresos Reales**: Las métricas de facturación se basan en el `importe_pagado` registrado, no en precios teóricos.
- **Segmentación**: Sistema de etiquetas y notas internas para un trato personalizado.
- **Acciones Rápidas**: Acceso directo a WhatsApp, Email o perfil de Instagram desde la ficha del cliente.

---

## 💰 Gestión Financiera
Módulo contable integrado para el control de la rentabilidad:
- **Ingresos de Reservas**: Vinculación automática según el estado de pago (Pendiente, Parcial, Pagado).
- **Gastos y Ajustes**: Registro manual de gastos operativos y otros ingresos no asociados a reservas.
- **Informes**: Generación de informes detallados y PDFs imprimibles para el cierre de ejercicio.

---

## 🛡️ Seguridad y Auditoría
- **Protección de Rutas**: Middleware de Next.js para asegurar que solo administradores autenticados accedan al panel.
- **Row Level Security (RLS)**: Políticas estrictas en PostgreSQL que impiden el acceso público a tablas sensibles (clientes, finanzas, logs).
- **Audit Logs**: Registro detallado (quién, qué, cuándo) de cada cambio en el sistema.
- **Borrado Lógico**: Uso de `deleted_at` para prevenir la pérdida accidental de datos.
- **Anti-Bot**: Integración de Cloudflare Turnstile en todos los formularios públicos.

---

## 🗄️ Estructura de Datos (Tablas)
- `administrador`: Perfiles con acceso al panel.
- `servicio`: Catálogo de servicios y precios.
- `imagen`: Gestión de la galería multimedia.
- `contacto`: Registro de mensajes recibidos.
- `reserva`: Citas principales con estado de pago y vinculación a cliente.
- `reserva_bloque`: Franjas horarias ocupadas en el calendario.
- `bloqueo_horario`: Franjas cerradas manualmente por el admin.
- `cliente`: Base de datos del CRM con métricas acumuladas.
- `cliente_nota`: Notas internas sobre clientes.
- `finanza_movimiento`: Registro de gastos e ingresos manuales.
- `audit_log`: Registro de actividad del sistema.

---

## 📁 Estructura del Proyecto
```text
GarageStudiosWeb/
├── src/
│   ├── app/            # Rutas (App Router), Layouts y Páginas
│   │   ├── actions/    # Lógica de servidor (Server Actions)
│   │   ├── admin/      # Panel de administración privado
│   │   ├── api/        # Endpoints de API (iCal, etc.)
│   │   └── (público)/  # Vistas públicas de la web
│   ├── components/     # Componentes de UI reutilizables
│   ├── lib/            # Utilidades y configuraciones (Supabase, Email)
│   └── middleware.ts   # Protección de rutas y seguridad
├── public/             # Assets estáticos (Imágenes, Iconos)
├── supabase/           # Migraciones SQL y configuración de DB
├── docs/               # Documentación adicional y de defensa
├── package.json        # Dependencias y scripts
└── README.md           # Este archivo
```

---

## ⚙️ Configuración del Entorno
Para ejecutar el proyecto localmente, es necesario un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
RESEND_API_KEY=tu_api_key_resend
EMAIL_FROM=noreply@garagestudios.es
EMAIL_REPLY_TO=garagestudioslp@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_site_key
TURNSTILE_SECRET_KEY=tu_secret_key
```

---

## 🚀 Instalación y Despliegue

### Local
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`.
3. Configurar `.env.local`.
4. Ejecutar en desarrollo: `npm run dev`.

### Producción
1. Construir el proyecto: `npm run build`.
2. El despliegue se realiza automáticamente en **Vercel** al hacer push a la rama `main`.

---

## 📄 Documentación Adicional
En la carpeta [`/docs`](./docs) se encuentran guías detalladas sobre:
- [Defensa del Proyecto (Actividad 6)](./docs/defensa-actividad-6.md)
- [Guía de Backup y Seguridad](./docs/backup.md)
- [Mapa de Capturas Recomendadas](./docs/capturas-recomendadas.md)
- [Hoja de Ruta de Mejoras Futuras](./docs/mejoras-futuras.md)

---

## 📈 Estado del Proyecto
El proyecto se encuentra en estado **funcional y estable**, desplegado en producción y siendo utilizado activamente por el estudio. Cumple con todos los requisitos académicos para la entrega del ciclo superior DAW.

**Autor:** Kevin Ochoa
*Técnico Superior en Desarrollo de Aplicaciones Web*
🏝️ Las Palmas de Gran Canaria, 2026
