-- Habilitar extensión UUID si no está (normalmente ya lo está en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: administrador
CREATE TABLE public.administrador (
    id UUID PRIMARY KEY, -- En el futuro esto referenciará a auth.users.id
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla: servicio
CREATE TABLE public.servicio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.administrador(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Sonido',
    subcategoria TEXT,
    icono TEXT NOT NULL DEFAULT '✅',
    es_pack BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla: imagen
CREATE TABLE public.imagen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.administrador(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    url_imagen TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: reserva
CREATE TABLE public.reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_id UUID NOT NULL REFERENCES public.servicio(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha_reserva DATE NOT NULL,
    observaciones TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla: contacto
CREATE TABLE public.contacto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
