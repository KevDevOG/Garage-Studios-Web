# Garage Studios Web 🎸

Proyecto final de **Desarrollo de Aplicaciones Web (DAW)**. Una plataforma web Full-Stack profesional diseñada y desarrollada para un estudio real de producción musical y audiovisual en Las Palmas de Gran Canaria.

🔗 **[Visitar la web en producción](https://garagestudios.es)**

---

## 📋 Descripción General

Garage Studios Web es una aplicación robusta diseñada para centralizar la presencia digital y la gestión operativa de un estudio creativo. Combina una interfaz pública de alto impacto visual con un panel de administración privado (Backoffice) que permite gestionar todo el ecosistema del negocio: desde el catálogo de servicios y la galería, hasta un avanzado sistema de reservas, CRM de clientes y control financiero.

El proyecto está optimizado para ofrecer una experiencia fluida tanto en escritorio como en dispositivos móviles, priorizando el rendimiento, el SEO y la seguridad de los datos.

## 🚀 Tecnologías Utilizadas

### Frontend & Framework
- **Next.js (App Router)**: Framework de React para producción con renderizado híbrido.
- **React**: Biblioteca para la construcción de interfaces de usuario.
- **TypeScript**: Tipado estático para un desarrollo más robusto y mantenible.
- **Tailwind CSS**: Framework de CSS para un diseño moderno y responsive.
- **Framer Motion**: Biblioteca para animaciones fluidas y efectos de scroll.

### Backend & Infraestructura
- **Supabase**: Backend-as-a-Service (BaaS).
    - **PostgreSQL**: Base de datos relacional de alto rendimiento.
    - **Supabase Auth**: Sistema de autenticación de usuarios.
    - **Supabase Storage**: Almacenamiento de imágenes y archivos.
- **Server Actions**: Mutaciones y lógica de servidor integradas en Next.js.
- **Resend**: Servicio de envío de correos electrónicos transaccionales.
- **Cloudflare Turnstile**: Protección anti-bot inteligente y no intrusiva.
- **Vercel**: Plataforma de despliegue y hosting cloud.

### Integraciones & Otros
- **Spotify Embeds**: Reproducción de producciones musicales directamente en la web.
- **iCalendar (.ics)**: Generación de eventos para calendarios de Google, Apple y Outlook.
- **Git / GitHub**: Control de versiones y CI/CD.

---

## ✨ Funcionalidades

### 🌐 Parte Pública
- **Landing Page**: Diseño premium con animaciones al hacer scroll (Scroll Reveal).
- **Servicios**: Catálogo dinámico con filtrado y detalles de precios.
- **Garage Visuals**: Sección dedicada a la producción audiovisual con portafolio.
- **Galería / El Estudio**: Visualización de las instalaciones mediante imágenes dinámicas.
- **Sistema de Reservas**: Formulario inteligente con validación de disponibilidad en tiempo real.
- **Ubicación**: Integración con Google Maps y botones de navegación directa.
- **Cumplimiento Legal**: Páginas completas de Aviso Legal, Privacidad y Cookies.

### 🔐 Panel de Administración (CRM & Gestión)
El panel administrativo permite el control total del negocio sin necesidad de tocar código:
- **Dashboard Principal**: Resumen visual del estado del estudio y métricas clave.
- **Calendario Administrativo**: Vista detallada de todas las citas y bloqueos de horario.
- **Gestión de Reservas**: Control de estados (Pendiente, Confirmada, Cancelada, Rechazada, Completada).
- **Gestión de Clientes (CRM)**: Historial completo de reservas por cliente, notas internas y detección de clientes recurrentes.
- **Módulo de Finanzas**: Registro de ingresos y gastos, cálculo de beneficios mensuales y ticket medio.
- **Gestión de Servicios y Galería**: CRUD completo para actualizar el contenido público de la web.
- **Sistema de Auditoría**: Registro (logs) de todas las acciones críticas realizadas por los administradores.

---

## 📅 Sistema de Reservas y Disponibilidad

El motor de reservas ha sido desarrollado para prevenir solapamientos y asegurar una gestión eficiente:
1. **Selección de Servicio**: Carga dinámica de duración y precio.
2. **Control de Disponibilidad**: Bloqueo de fechas pasadas y horas ya ocupadas por otras reservas o bloqueos manuales del administrador.
3. **Validación Server-Side**: Protección contra envíos duplicados o datos inconsistentes.
4. **Notificaciones**: Envío automático de confirmaciones por email y generación de mensaje de WhatsApp prellenado para el administrador.

---

## 💰 Módulo Financiero y CRM

### Finanzas
- **Trazabilidad**: Relación directa entre ingresos y reservas completadas.
- **Análisis**: Visualización de beneficios netos y gastos operativos.
- **Exportación**: Posibilidad de descargar los movimientos financieros en formato **Excel** para gestoría.

### CRM de Clientes
- **Retención**: Identificación automática de clientes que vuelven al estudio.
- **Historial**: Acceso rápido a todos los trabajos realizados anteriormente con un cliente.
- **Notas**: Almacenamiento de preferencias técnicas o comentarios del administrador.

---

## 🛡️ Seguridad y Auditoría

La plataforma implementa múltiples capas de seguridad para proteger la integridad del negocio:
- **Middleware**: Protección de todas las rutas `/admin` mediante sesiones de Supabase.
- **Row Level Security (RLS)**: Políticas a nivel de base de datos que impiden que un usuario no autorizado acceda a datos sensibles (finanzas, clientes, auditoría).
- **Audit Logs**: Registro detallado de quién hizo qué y cuándo (Ej: "Admin X confirmó la reserva Y").
- **Rate Limiting**: Protección contra ataques de fuerza bruta y spam en formularios públicos.
- **Soft Delete**: Los registros sensibles no se eliminan físicamente de inmediato para permitir recuperaciones.

---

## 🗄️ Base de Datos

El esquema se compone de las siguientes tablas principales:
- `administrador`: Perfiles con acceso al panel.
- `servicio`: Definición de precios y duraciones.
- `imagen`: Archivos de la galería pública.
- `contacto`: Mensajes recibidos desde la web.
- `reserva`: Registro principal de citas.
- `reserva_bloque`: Bloqueos de calendario (mantenimiento, festivos, packs).
- `cliente`: Base de datos de contactos y CRM.
- `finanza_movimiento`: Contabilidad del estudio.
- `audit_log`: Registro de actividad administrativa.

---

## 📁 Estructura del Proyecto

```text
src/
├── app/            # App Router (Páginas, Layouts y API)
│   ├── actions/    # Server Actions (Lógica de negocio y DB)
│   ├── admin/      # Rutas del Panel de Administración
│   ├── api/        # Endpoints (Webhooks, ICS generation)
│   └── (público)/  # Rutas visibles para el usuario
├── components/     # Componentes de UI (Navbar, Forms, Cards)
├── lib/            # Utilidades, Clientes (Supabase) y Helpers
├── types/          # Definiciones de TypeScript
├── supabase/       # Migraciones SQL y esquemas
└── public/         # Assets estáticos (Logo, Favicon)
```

---

## 🛠️ Instalación y Configuración Local

1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/KevDevOG/Garage-Studios-Web.git
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de Entorno**:
   Crea un archivo `.env.local` y añade tus claves (no subas este archivo a GitHub):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   RESEND_API_KEY=tu_api_key_resend
   EMAIL_FROM=tu_email_verificado
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_site_key_cloudflare
   TURNSTILE_SECRET_KEY=tu_secret_key_cloudflare
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Build**:
   ```bash
   npm run build
   ```

---

## 🏁 Estado y Futuro

El proyecto se encuentra **completamente funcional** y en uso real por el negocio. 
Como parte de su evolución, se planean las siguientes mejoras:
- Automatización total de finanzas al completar reservas.
- Integración directa con la API oficial de WhatsApp.
- Generación automática de facturas en PDF.
- Roles de usuario (Admin vs Colaborador).

---

**Autor:** Kevin Ochoa
*Estudiante de Desarrollo de Aplicaciones Web (DAW)*
