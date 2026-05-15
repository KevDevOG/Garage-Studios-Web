# Defensa de Proyecto - Actividad 6 🎓
**Proyecto:** Garage Studios Web
**Autor:** Kevin Ochoa
**Curso:** 2º Desarrollo de Aplicaciones Web (DAW)

## 1. Alcance del Proyecto
El proyecto consiste en una plataforma web integral para un estudio de grabación real. Cubre desde la captación de clientes mediante una interfaz pública atractiva hasta la gestión operativa completa (reservas, CRM, finanzas) en un panel privado. El objetivo principal es digitalizar y profesionalizar la operativa diaria del negocio.

## 2. Casos de Uso Principales
- **Cliente:** Consulta servicios, visualiza la galería, escucha producciones en Spotify y reserva una sesión según disponibilidad real.
- **Administrador:** Gestiona el calendario, confirma/cancela reservas, registra gastos e ingresos, analiza la rentabilidad mensual y exporta informes a Excel.
- **Sistema:** Envía correos de confirmación, bloquea horarios automáticamente y registra auditorías de cada acción.

## 3. Modelo de Datos
La base de datos en Supabase (PostgreSQL) se organiza en:
- `reserva`: Tabla central con estados de cita y pago.
- `cliente`: CRM con historial, etiquetas y notas.
- `finanza_movimiento`: Contabilidad vinculada a reservas o manual.
- `audit_log`: Trazabilidad de acciones administrativas.
- `servicio` y `imagen`: Contenido dinámico de la web pública.

## 4. Tecnologías Frontend
- **Framework:** Next.js 15+ (App Router) para máxima velocidad y SEO.
- **Lenguaje:** TypeScript para evitar errores en tiempo de ejecución.
- **Estilos:** Tailwind CSS para un diseño responsivo y moderno.
- **Animaciones:** Framer Motion para una experiencia premium.

## 5. Tecnologías Backend
- **Server Actions:** Para toda la lógica de negocio sin necesidad de una API REST tradicional.
- **Supabase Auth:** Gestión segura de sesiones administrativas.
- **Supabase Storage:** Almacenamiento optimizado de activos multimedia.

## 6. Base de Datos
- **Motor:** PostgreSQL alojado en Supabase.
- **Migraciones:** Gestión controlada del esquema mediante archivos `.sql`.
- **Relaciones:** Uso intensivo de claves foráneas para integridad referencial (ej: Cliente <-> Reserva <-> Finanza).

## 7. Servicios Web e Integraciones
- **Resend:** Notificaciones automáticas por email.
- **ExcelJS:** Generación de reportes XLSX descargables.
- **Cloudflare Turnstile:** Protección contra spam.
- **Spotify API:** Integración de reproductores de audio.
- **WhatsApp Web API:** Generación de mensajes automáticos.

## 8. Seguridad
- **Protección de Rutas:** Middleware de Next.js para rutas `/admin`.
- **RLS (Row Level Security):** Políticas en base de datos para restringir accesos.
- **Sanitización:** Validación estricta de tipos y datos en Server Actions.
- **Variables de Entorno:** Todas las claves privadas gestionadas en Vercel/.env.local.

## 9. Despliegue
- **Hosting:** Vercel para el frontend y backend (Serverless).
- **Dominio:** https://garagestudios.es configurado con SSL.
- **CI/CD:** Despliegue automático al hacer push a la rama main.

## 10. Demo Práctica (Guión de Defensa)
1. Mostrar la **Home** y las animaciones de scroll.
2. Realizar una **Reserva** en directo, mostrando cómo el selector de horas detecta bloqueos.
3. Entrar en el **Panel Admin** y mostrar el Dashboard.
4. Convertir la reserva anterior en "Confirmada" y ver cómo se refleja en el Calendario.
5. Ir a **Finanzas** y exportar un Excel.
6. Mostrar el log de **Auditoría** para ver el registro de las acciones anteriores.

## 11. Posibles Preguntas del Profesor
- **¿Por qué Next.js?** Por el renderizado híbrido (SSR/ISR) y la facilidad de uso de Server Actions.
- **¿Cómo evitas solapamientos de reservas?** Mediante una consulta de disponibilidad que cruza las reservas existentes y los bloqueos horarios antes de permitir el envío.
- **¿Cómo proteges los datos financieros?** Mediante Row Level Security en Supabase y el Middleware de Next.js que valida la sesión del administrador.

## 12. Conclusión
El proyecto cumple con los requisitos técnicos de un entorno real de producción, demostrando la capacidad de integrar múltiples servicios en una solución Full-Stack coherente, escalable y segura.
