# Garage Studios Web 🎸

Proyecto final de **Desarrollo de Aplicaciones Web (DAW)**. Una plataforma web Full-Stack profesional diseñada y desarrollada para un estudio real de producción musical y audiovisual en Las Palmas de Gran Canaria.

🔗 **[Visitar la web en producción](https://garagestudios.es)**

---

## 📋 Descripción General

Garage Studios Web es una aplicación robusta diseñada para centralizar la presencia digital y la gestión operativa de un estudio creativo. Combina una interfaz pública de alto impacto visual con un panel de administración privado (Backoffice) que permite gestionar todo el ecosistema del negocio: desde el catálogo de servicios y la galería, hasta un avanzado sistema de reservas, CRM de clientes y control financiero.

El proyecto está optimizado para ofrecer una experiencia fluida tanto en escritorio como en dispositivos móviles, priorizando el rendimiento, el SEO y la seguridad de los datos.

## 🚀 Tecnologías Utilizadas

### Frontend & Framework
- **Next.js 15 (App Router)**: Framework de React con renderizado híbrido (SSR, ISR, CSR).
- **React 19**: Biblioteca para la construcción de interfaces de usuario.
- **TypeScript**: Tipado estático para un desarrollo seguro.
- **Tailwind CSS**: Estilizado moderno y responsivo.
- **Framer Motion**: Animaciones fluidas y efectos de scroll premium.

### Backend & Infraestructura
- **Supabase**: Backend-as-a-Service (BaaS) con PostgreSQL.
- **Supabase Auth**: Autenticación segura para administradores.
- **Supabase Storage**: Almacenamiento multimedia para galería y servicios.
- **Server Actions**: Lógica de servidor y mutaciones integradas.
- **Resend**: Emails transaccionales automáticos.
- **Cloudflare Turnstile**: Protección anti-bot de última generación.
- **Vercel**: Hosting y despliegue continuo (CI/CD).

### Integraciones
- **ExcelJS**: Motor de generación de reportes XLSX.
- **Spotify API**: Integración de reproductores de audio.
- **WhatsApp API**: Enlaces automáticos de comunicación directa.
- **Lucide React**: Iconografía vectorial profesional.

---

## ✨ Funcionalidades Destacadas

### 🌐 Parte Pública
- **Diseño Premium**: Interfaz oscura de alta gama con efectos de vidrio (glassmorphism) y animaciones de revelado.
- **Reserva Inteligente**: Sistema que calcula la disponibilidad real cruzando citas existentes y bloqueos horarios.
- **Galería Dinámica**: Visualización fluida de las instalaciones y trabajos realizados.
- **Secciones Especializadas**: Garage Visuals (audiovisual) y Servicios detallados.
- **SEO & Legal**: Optimizado para buscadores y cumplimiento total con RGPD/LSSI.

### 🔐 Panel de Administración (CRM & ERP)
- **Dashboard App-Style**: Resumen en tiempo real con KPIs (Ingresos, Reservas hoy, Mensajes nuevos).
- **Gestión de Calendario**: Vista de citas y creación de bloqueos horarios (festivos, mantenimiento).
- **CRM Avanzado**: Ficha de cliente con historial comercial, etiquetas personalizadas y notas internas.
- **Finanzas Profesionales**: Registro de ingresos reales desde reservas, control de gastos y balance de beneficios.
- **Exportación de Datos**: Descarga de informes Excel para contabilidad y análisis.
- **Trazabilidad (Auditoría)**: Registro detallado de cada acción administrativa con filtros avanzados.
- **Modo Compacto**: Opción de interfaz de alta densidad para una gestión rápida.

---

## 📅 Sistema de Disponibilidad

El motor de reservas previene solapamientos mediante una lógica de servidor estricta:
1. **Validación de Citas**: No permite reservar en horarios ya ocupados.
2. **Bloqueos Horarios**: El administrador puede cerrar franjas horarias manualmente.
3. **Notificaciones**: El cliente recibe un email instantáneo y se genera un WhatsApp prellenado para el estudio.

---

## 🛡️ Seguridad

- **Middleware**: Protección de todas las rutas `/admin`.
- **RLS (Row Level Security)**: Políticas en DB para que ningún usuario anónimo acceda a datos sensibles.
- **Audit Logs**: Registro inalterable de actividad.
- **Soft Delete**: Recuperación de datos borrados accidentalmente.

---

## 📁 Estructura del Proyecto

```text
src/
├── app/            # App Router (Rutas, Layouts, API y Actions)
│   ├── actions/    # Lógica de servidor (DB, Auth, Email, Excel)
│   ├── admin/      # Backoffice administrativo
│   └── (público)/  # Web pública
├── components/     # Componentes de UI reutilizables
├── lib/            # Configuraciones (Supabase, Email, Status colors)
├── types/          # Definiciones de TypeScript
├── supabase/       # Migraciones SQL y esquemas
└── docs/           # Documentación de proyecto y defensa
```

---

## 🛠️ Instalación Local

1. **Clonar**: `git clone https://github.com/KevDevOG/Garage-Studios-Web.git`
2. **Dependencias**: `npm install`
3. **Configuración**: Crear `.env.local` con las claves de Supabase, Resend y Turnstile.
4. **Desarrollo**: `npm run dev`
5. **Producción**: `npm run build`

---

## 📄 Documentación Adicional

En la carpeta [`/docs`](./docs) encontrarás:
- [Guía de Defensa (Actividad 6)](./docs/defensa-actividad-6.md)
- [Mejoras Futuras](./docs/mejoras-futuras.md)
- [Guía de Capturas](./docs/capturas-recomendadas.md)
- [Backup y Seguridad](./docs/backup.md)

---

**Autor:** Kevin Ochoa  
*Proyecto Final de Ciclo Superior - DAW (2026)*
