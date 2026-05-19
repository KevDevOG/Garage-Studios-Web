# Garage Studios Web

Plataforma web Full-Stack profesional para un estudio de grabación musical y producción audiovisual, diseñada como proyecto final de **Desarrollo de Aplicaciones Web (DAW)** y optimizada para servir como portal de negocio en producción.

## 🔗 Demo
**[https://garagestudios.es](https://garagestudios.es)**

La aplicación está desplegada en producción en **Vercel** con dominio propio, certificado SSL y CI/CD automatizado desde GitHub.

---

## 📋 Descripción del Proyecto
Garage Studios Web es una solución digital completa orientada a la presencia comercial y la automatización operativa de un estudio musical y audiovisual. 

El sistema consta de:
* **Web Pública de Alto Impacto**: Diseñada con una estética oscura premium, transiciones inmersivas (incluyendo un Intro Loader cinemático con vídeo 3D), y un motor de reservas interactivo en tiempo real integrado con pasarelas de comunicación.
* **Garage Visuals**: Landing y módulo independiente con una estética clara/premium dedicada a la fotografía, videoclips y producciones cinematográficas, con carruseles categorizados y visor lightbox.
* **Panel de Administración Privado (Backoffice)**: Un panel tipo "App-Style" altamente dinámico y adaptado a móviles que centraliza la agenda del estudio, gestión de servicios, CRM de clientes con segmentación, control de ingresos y gastos contables, logs de auditoría interna y exportaciones estructuradas a Excel.

---

## ✨ Funcionalidades Principales

### 🌐 Web Pública
* **Experiencia Cinemática (Intro Loader)**: Pantalla de presentación de 2 segundos que reproduce en bucle el logotipo en 3D del estudio (`logo3d.webm`/`logo3d.mp4`), con una barra de progreso dorada ultrafina y persistencia inteligente por sesión (`sessionStorage`).
* **Estética Premium Adaptable**: Estructura visual oscura en la Home principal complementada con efectos de rayos sutiles (`rayos.webm`) limitados a la sección de planes en pantallas grandes, optimizando el rendimiento y la legibilidad.
* **Sincronización de Identidad**: Tipografías modernas (Inter/Outfit), favicons de marca en múltiples tamaños (`favicon.ico`, `icon.png`, `apple-icon.png`) y una navegación fluida con scroll suave interceptado en el Navbar al interactuar en la misma ruta.
* **Catálogo de Servicios**: Visualización de tarifas y packs musicales con iconos animados locales y carga reactiva.
* **Sección Musical y Sonido**: Integración de reproductores enriquecidos de Spotify para mostrar trabajos destacados.
* **Cumplimiento Legal y Privacidad**: Adaptada al RGPD con banners de cookies interactivos, páginas dedicadas a Aviso Legal, Política de Privacidad y Política de Cookies.
* **Formulario de Contacto**: Protegido contra spam y abusos mediante la integración invisible de Cloudflare Turnstile.

### 🎥 Garage Visuals
* **Identidad de Submarca**: Landing de estética clara/premium enfocada a producciones audiovisuales (videoclips, sesiones fotográficas, rodajes corporativos).
* **Visores de Portafolio**:
  * Integración optimizada de vídeos de YouTube.
  * Galería dinámica con carruseles segmentados por tipología: **Sesiones de fotos**, **Sesiones de grabación** y **Rodajes**.
  * Lightbox de pantalla completa ultrafluido para examinar los detalles.
* **Módulo de Administración Dedicado**: Gestión completa desde el panel administrativo privado (`/admin/visuals`), permitiendo subida múltiple de imágenes, asignación de categorías, activación/desactivación lógica y eliminación directa de Storage.
* **Infraestructura de Archivos**: Integración de Supabase Storage para alojar imágenes optimizadas de alta definición.

### 📅 Agenda y Reservas
* **Cálculo Dinámico de Disponibilidad**: Motor reactivo que calcula solapamientos en tiempo real basándose en la duración del servicio seleccionado y las citas existentes.
* **Bloqueos Horarios**: Capacidad administrativa para anular franjas horarias específicas (festivos, mantenimiento, vacaciones), afectando al instante a la disponibilidad pública.
* **Gestión de Estados**: Ciclo de vida completo de la reserva (Pendiente, Confirmada, Completada, Cancelada) con estados de pago asociados (Pendiente, Parcial, Pagado).
* **Comunicación Automatizada**:
  * Envíos automáticos de emails transaccionales (confirmación, cancelación, aviso de finalización) usando plantillas HTML profesionales con **Resend**.
  * Generación automática de archivos de calendario **.ics** para añadir la reserva a Google Calendar, Apple Calendar o Outlook.
  * Accesos rápidos para abrir conversaciones de WhatsApp con plantillas de texto prellenadas.

### 🔐 Panel Administrativo y CRM de Clientes
* **Dashboard Ejecutivo**: Panel intuitivo de control con KPIs financieros y operativos clave del mes y del día actual.
* **Buscador Universal**: Barra de búsqueda unificada en la cabecera capaz de localizar reservas, clientes o mensajes al instante.
* **CRM Comercial Avanzado**: Ficha de cliente interactiva con cálculo automático de valor acumulado (basado en facturación real de cobros), segmentación de perfiles mediante etiquetas (Tags) de colores y registro de notas internas.
* **Auditoría e Integridad**: Logs inalterables de acciones administrativas para el seguimiento de altas, modificaciones y bajas.
* **Exportaciones**: Módulo de exportación directa a hojas de cálculo Excel (`.xlsx`) utilizando `ExcelJS` para informes de finanzas, reservas, CRM y contactos.
* **Diseño Multidispositivo**: Interfaz de alta densidad en tablets/escritorio y modo móvil adaptativo optimizado para la gestión en movilidad del personal del estudio.

---

## 🛠️ Stack Tecnológico

### Frontend
* **Next.js 16 (App Router)**: Estructuración moderna de rutas y layouts, combinando SSR (Server Side Rendering) y componentes de cliente reactivos.
* **React 19**: Biblioteca base para la gestión de vistas y hooks avanzados de estado.
* **TypeScript**: Tipado estático estricto para asegurar la robustez y escalabilidad del código.
* **Tailwind CSS v4**: Estilos premium responsivos y rápidos sin sobredimensionar el bundle CSS.
* **Framer Motion**: Animaciones fluidas basadas en scroll y transiciones cinemáticas (ScrollReveal).

### Backend, Base de Datos y Almacenamiento
* **Supabase & PostgreSQL**: Base de datos relacional y gestión de usuarios.
* **Supabase Auth**: Autenticación segura y persistente para las rutas del panel de administración.
* **Supabase Storage**: Bucket público optimizado (`garage-visuals`) para almacenar capturas, material fotográfico y portafolio de alta definición.
* **Server Actions**: Lógica de servidor segura y directa para consultas y mutaciones de la base de datos sin necesidad de API Controllers tradicionales.

### Integraciones y Servicios Externos
* **Resend**: Proveedor y API para envíos de correo transaccional de estado de reservas.
* **Cloudflare Turnstile**: Alternativa de accesibilidad y alto rendimiento a reCAPTCHA para la validación de bots.
* **ExcelJS**: Librería de servidor para generar hojas de cálculo y exportar reportes de negocio dinámicos.
* **Sonner**: Toasts de notificación enriquecidos con estilos oscuros y soporte enriquecido.

---

## 📁 Estructura del Proyecto

```text
GarageStudiosWeb/
├── public/                 # Recursos estáticos de la web
│   ├── images/             # Logotipos oficiales, imágenes de galería y subcarpetas de submarca
│   ├── videos/             # Vídeos cinematográficos (logo3d.webm, rayos.webm)
│   └── icons/              # Iconografía de servicios locales
├── src/
│   ├── app/                # Rutas de Next.js App Router (Páginas y layouts)
│   │   ├── actions/        # Mutaciones e interacciones de DB (Server Actions)
│   │   ├── admin/          # Panel privado administrativo (CRM, Auditoría, Finanzas, Visuals)
│   │   ├── api/            # API endpoints (calendario iCal .ics, webhooks)
│   │   ├── visuals/        # Landing e identidad comercial de Garage Visuals
│   │   ├── layout.tsx      # Layout raíz y metadatos SEO/iconos principales
│   │   └── globals.css     # Estilos globales y tokens de diseño
│   ├── components/         # Componentes React reutilizables
│   │   ├── admin/          # Componentes del CRM, Dashboard y Tablas Administrativas
│   │   ├── visuals/        # Carruseles, Lightbox y visores de Garage Visuals
│   │   └── ui/             # Elementos comunes y wrappers de animación (ScrollReveal)
│   ├── lib/                # Inicialización de servicios (supabase, resend, utils)
│   └── middleware.ts       # Protección perimetral de las rutas de administración (/admin)
├── supabase/
│   └── migrations/         # Script de migraciones locales e historiales SQL
├── package.json            # Dependencias y scripts de construcción
└── README.md               # Este archivo de referencia
```

---

## 🗄️ Arquitectura de Base de Datos y Migraciones

La plataforma utiliza **PostgreSQL** hospedado en Supabase con políticas estrictas de seguridad **RLS (Row Level Security)**.

### Tablas Principales
* `administrador`: Cuentas autorizadas con acceso al panel.
* `servicio`: Catálogo de packs, duraciones y precios de grabación y vídeo.
* `reserva`: Citas que vinculan fechas, importes pagados y estados de facturación.
* `cliente`: CRM integrado con métricas calculadas y ranking de rentabilidad.
* `cliente_nota`: Registro cronológico de notas privadas tomadas por administradores.
* `contacto`: Bandeja de entrada de mensajes del formulario público.
* `finanza_movimiento`: Movimientos de caja manuales (gastos y aportaciones).
* `audit_log`: Registro inalterable de mutaciones administrativas.
* `visuals_imagen`: Almacenamiento y categorización de archivos de portafolio visual.

### Migraciones Recientes Destacadas
La infraestructura se gestiona de forma progresiva a través de scripts SQL controlados:
* **`015_visuals_gallery.sql`**: Creación de la tabla `visuals_imagen` para centralizar la galería de submarca.
* **`016_visuals_storage_bucket.sql`**: Inicialización del bucket físico `garage-visuals` y definición de políticas de lectura pública y escritura administrativa.
* **`017_alter_visuals_imagen_titulo_nullable.sql`**: Flexibilización de campos, haciendo opcional el título de la imagen en subidas por lotes.
* **`018_visuals_categories_cleanup.sql`**: Normalización estricta de categorías válidas mediante restricción `CHECK` (`fotos`, `grabaciones`, `rodajes`).

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto para la configuración local:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica

# Resend & Email
RESEND_API_KEY=re_tu_api_key
EMAIL_FROM=noreply@garagestudios.es
EMAIL_REPLY_TO=garagestudioslp@gmail.com

# URL de la aplicación (para .ics y enlaces)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu-site-key-turnstile
TURNSTILE_SECRET_KEY=tu-secret-key-turnstile
```

---

## 🚀 Instalación y Ejecución Local

### Requisitos
* Node.js v20 o superior
* Cuenta en Supabase con base de datos PostgreSQL

### Pasos
1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/KevDevOG/Garage-Studios-Web.git
   cd Garage-Studios-Web
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar el entorno**:
   Duplica el archivo `.env.example` (o utiliza el bloque de variables de arriba) y crea tu `.env.local` completando las credenciales de tu proyecto.

4. **Migraciones**:
   Ejecuta los scripts contenidos en `supabase/migrations/` en el editor SQL de Supabase para inicializar el esquema y las políticas de base de datos.

5. **Iniciar el entorno de desarrollo**:
   ```bash
   npm run dev
   ```
   Accede a [http://localhost:3000](http://localhost:3000) en tu navegador.

6. **Compilación de producción**:
   ```bash
   npm run build
   ```

7. **Servir la compilación en local**:
   ```bash
   npm run start
   ```

---

## 🛡️ Medidas de Seguridad
* **Protección Perimetral**: El archivo `middleware.ts` intercepta cualquier acceso no autorizado a `/admin/*`, redirigiendo automáticamente a la pantalla de Login a menos que exista una sesión activa de Supabase Auth.
* **Políticas RLS en Base de Datos**: Las tablas sensibles (`cliente`, `finanza_movimiento`, `audit_log`) poseen políticas Row Level Security estrictas. Ningún usuario anónimo o agente externo sin el token de administrador firmado puede consultar o alterar la información.
* **Server Actions Seguros**: Las interacciones de la base de datos se ejecutan en el servidor, validando la sesión del administrador desde el backend en cada llamada, impidiendo inyecciones maliciosas de ID.
* **Control de Spam**: Integración de Cloudflare Turnstile en formularios públicos, bloqueando bots automatizados con una experiencia de usuario rápida y transparente.

---

## 📈 Estado del Proyecto
El proyecto se encuentra en un estado **estable, funcional y 100% verificado en producción**. Cumple holgadamente tanto con los requisitos de negocio para la gestión diaria del estudio, como con los estándares y competencias exigidos para la defensa del proyecto final del Ciclo Superior en Desarrollo de Aplicaciones Web (DAW).

---

## 🔮 Futuras Líneas de Mejora
* **Optimización de Medias**: Compresión y generación automática de versiones WebP/AVIF al subir fotografías a Supabase Storage desde el panel.
* **Preselección en Citas**: Carga automatizada del servicio seleccionado si el usuario pulsa "Reservar" desde una card de servicio específica, usando parámetros en la URL (`/reservas?servicioId=...`).
* **Historial de Eliminaciones**: Implementación de una sección de papelera de reciclaje en imágenes y reservas para revertir borrados accidentales de los administradores.
* **Integración de Pasarela de Pagos**: Soporte para cobro online de depósitos o reservas completas mediante pasarelas seguras (Stripe/Bizum).

---

## 📸 Capturas Recomendadas
*(Sección reservada para incorporar previsualizaciones visuales del sistema en la entrega final)*
* **Home**: Diseño inmersivo oscuro de Garage Studios.
* **Garage Visuals**: Landing de diseño cinematográfico claro.
* **Dashboard Administrativo**: KPIs de control financiero.
* **CRM de Clientes**: Fichas, etiquetas de colores y control de facturación real.
* **Calendario**: Vista de agenda del estudio y bloqueos de horas.

---

## 👤 Autor

**Kevin Ochoa**
*Técnico Superior en Desarrollo de Aplicaciones Web*
🏝️ Las Palmas de Gran Canaria, 2026
