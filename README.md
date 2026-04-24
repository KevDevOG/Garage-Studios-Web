# Garage Studios Web 🎸

Proyecto final de Desarrollo de Aplicaciones Web (DAW). Se trata de una plataforma web completa y profesional para un estudio de grabación y producción audiovisual ubicado en Las Palmas de Gran Canaria.

🔗 **[Visitar la web en producción](https://project-w9jbu.vercel.app)** 

## Descripción del Proyecto

Garage Studios Web es una solución Full-Stack diseñada para gestionar y promocionar los servicios de un estudio musical. La aplicación no solo funciona como un portfolio o escaparate digital de alto impacto visual (estética oscura y modo neón), sino que además integra un sistema completo de reservas y un panel de administración personalizado para la gestión dinámica del contenido de la web, reduciendo la dependencia de terceros.

## Tecnologías Utilizadas 🛠️

El proyecto ha sido desarrollado utilizando tecnologías modernas para garantizar un rendimiento óptimo, SEO técnico y una excelente experiencia de usuario (UX/UI):

- **Frontend:** Next.js 14+ (App Router), React, TypeScript.
- **Estilos:** Tailwind CSS.
- **Backend & Base de Datos:** Supabase (PostgreSQL), Supabase Auth, Supabase Storage.
- **Despliegue:** Vercel.
- **Control de Versiones:** Git y GitHub.

## Funcionalidades Principales ✨

### Parte Pública
- **Inicio:** Hero section con fondo dinámico, accesos directos a reservas y ubicación integrada mediante Google Maps.
- **Servicios:** Catálogo dinámico de servicios (grabación, mezcla, mastering, packs de diseño) ordenados por precio.
- **Galería:** Muestra de imágenes reales del estudio extraídas directamente del Storage de Supabase.
- **Garage Visuals:** Sección dedicada exclusivamente a la producción audiovisual (videoclips, sesiones de fotos).
- **Reservas:** Formulario interactivo conectado con la base de datos para solicitar horas de estudio.
- **Contacto:** Formulario directo y enlaces a redes sociales (Instagram, TikTok).

### Panel de Administración (Admin)
- Sistema de autenticación segura (Login).
- **CRUD de Servicios:** Crear, leer, actualizar y eliminar servicios del catálogo en tiempo real.
- **Gestión de Galería:** Subida de imágenes (hasta 10MB) al bucket de almacenamiento de Supabase.
- **Gestión de Reservas y Mensajes:** Visualización y control de los formularios enviados por los clientes.

## Estructura del Proyecto 📁

\`\`\`text
GarageStudiosWeb/
├── public/                 # Assets estáticos, favicon y og-image
├── src/
│   ├── app/                # App Router (Rutas públicas y protegidas)
│   │   ├── admin/          # Panel de administración protegido
│   │   ├── aviso-legal/    # Páginas legales
│   │   ├── galeria/        # Rutas de la web
│   │   ├── servicios/
│   │   ├── layout.tsx      # Layout principal y configuración SEO
│   │   └── page.tsx        # Home page
│   ├── components/         # Componentes reutilizables (Navbar, Footer, Cards)
│   ├── data/               # Datos estáticos o mocks
│   └── lib/                # Configuración de base de datos y utilidades (Supabase client)
├── supabase/               # Esquemas y políticas de seguridad de la base de datos
├── next.config.ts          # Configuración de Next.js (Dominios de imágenes, límites)
├── tailwind.config.ts      # Configuración de estilos y tokens de la marca
└── README.md
\`\`\`

## Variables de Entorno (.env.local) 🔐

Para ejecutar el proyecto en local, necesitas configurar las credenciales de Supabase en un archivo \`.env.local\` en la raíz del proyecto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
\`\`\`

*(Nota: Estas claves son públicas y seguras de exponer en el cliente gracias a las políticas RLS de Supabase, pero nunca deben subirse al control de versiones).*

## Instalación y Ejecución Local 💻

1. **Clonar el repositorio:**
   \`\`\`bash
   git clone https://github.com/KevDevOG/Garage-Studios-Web.git
   cd Garage-Studios-Web
   \`\`\`

2. **Instalar dependencias:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Ejecutar el servidor de desarrollo:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Abrir el proyecto:**
   Navega a [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel 🚀

El proyecto está diseñado para un despliegue transparente (Zero-config) en Vercel. 
1. Importa el repositorio desde el panel de Vercel.
2. Añade las dos variables de entorno de Supabase en la configuración del proyecto.
3. Haz clic en **Deploy**.

## Optimización y SEO 📈

- Metadata dinámica en cada ruta (Títulos y Descripciones).
- Open Graph (`og:image`) configurado globalmente para compartir correctamente en WhatsApp y redes sociales.
- Twitter Cards (`summary_large_image`).
- `robots.txt` implícito y JSON-LD (`MusicStudio` Schema) para indexación semántica en Google.

## Cumplimiento Legal ⚖️

El sitio web incluye las páginas necesarias para el cumplimiento de la normativa LSSI y RGPD de España para un proyecto académico:
- [Aviso Legal](/aviso-legal)
- [Política de Privacidad](/privacidad)
- [Política de Cookies](/cookies)

## Estado del Proyecto 🏁

**Completo y funcional**. El proyecto cumple con todos los requisitos propuestos en su concepción como trabajo final, encontrándose estable y desplegado en producción.

## Mejoras Futuras 🚀

- Integración de pasarela de pago (Stripe) para reservas inmediatas.
- Sistema de usuarios/clientes para seguimiento de proyectos musicales.
- Reproductor de audio integrado para escuchar referencias o trabajos anteriores del estudio.

---
**Autor:** Kevin Ochoa
