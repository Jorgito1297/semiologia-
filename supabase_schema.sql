-- ============================================================================
-- SCRIPT DE MIGRACIÓN: Base de Datos Relacional Multi-Tenant para "Study With Me"
-- Base de Datos: Supabase PostgreSQL (esquema public)
-- Idioma: Español
-- ============================================================================

-- Habilitar extensión para UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLA DE PERFILES DE USUARIO
-- ==========================================
-- Sincronizada con auth.users administrado por Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'instructor')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para crear automáticamente el perfil tras el registro en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. TABLA DE CREDENCIALES Y TOKENS ENCRIPTADOS DE MOODLE
-- ==========================================
-- Guarda el token cifrado de Moodle y el vector de inicialización (IV) para AES-256-GCM.
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    moodle_url TEXT NOT NULL,
    encrypted_token TEXT NOT NULL, -- Token cifrado en formato hex o base64
    encryption_iv TEXT NOT NULL,   -- Vector de Inicialización usado para descifrar en Edge Functions
    moodle_user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para actualizar updated_at automáticamente en cada cambio
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_tokens_updated_at
  BEFORE UPDATE ON public.user_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MIGRACIÓN: Si la base de datos ya existe, agregar la columna sin errores
ALTER TABLE public.user_tokens
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- ==========================================
-- 3. TABLA DE CURSOS DE MOODLE (CACHE LOCAL)
-- ==========================================
-- Guarda las materias registradas para optimizar tiempos de respuesta y búsquedas de syllabus.
CREATE TABLE IF NOT EXISTS public.moodle_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    moodle_course_id INTEGER NOT NULL,
    fullname TEXT NOT NULL,
    shortname TEXT NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, moodle_course_id)
);

-- ==========================================
-- 4. TABLA DE ASIGNACIONES (TAREAS/DEBERES DE MOODLE)
-- ==========================================
-- Cachea las tareas descargadas por el proxy web service.
CREATE TABLE IF NOT EXISTS public.moodle_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.moodle_courses(id) ON DELETE CASCADE NOT NULL,
    moodle_assign_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    duedate TIMESTAMP WITH TIME ZONE,
    allowsubmissions BOOLEAN DEFAULT TRUE,
    submitted BOOLEAN DEFAULT FALSE,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, moodle_assign_id)
);

-- ==========================================
-- 5. TABLA DE EXÁMENES Y EVENTOS DEL CALENDARIO DE MOODLE
-- ==========================================
-- Registra exámenes y recordatorios institucionales.
CREATE TABLE IF NOT EXISTS public.moodle_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.moodle_courses(id) ON DELETE CASCADE NOT NULL,
    moodle_event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    timestart TIMESTAMP WITH TIME ZONE NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, moodle_event_id)
);

-- ============================================================================
-- ÍNDICES DE BASE DE DATOS (Optimizan búsquedas en consultas multi-tenant)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_moodle_courses_user ON public.moodle_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_moodle_assignments_user ON public.moodle_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_moodle_assignments_course ON public.moodle_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_moodle_exams_user ON public.moodle_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_moodle_exams_course ON public.moodle_exams(course_id);

-- ============================================================================
-- SEGURIDAD A NIVEL DE FILA (Row-Level Security - RLS)
-- ============================================================================
-- Asegura el aislamiento de inquilino de modo que los estudiantes no vean datos ajenos.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodle_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodle_exams ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla de perfiles
CREATE POLICY "profiles_owner_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_owner_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para tokens encriptados de Moodle (Restricción absoluta)
CREATE POLICY "user_tokens_owner_select" ON public.user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_tokens_owner_insert" ON public.user_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tokens_owner_update" ON public.user_tokens
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tokens_owner_delete" ON public.user_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para cursos cacheados
CREATE POLICY "moodle_courses_owner_policy" ON public.moodle_courses
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para asignaciones/tareas
CREATE POLICY "moodle_assignments_owner_policy" ON public.moodle_assignments
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para exámenes
CREATE POLICY "moodle_exams_owner_policy" ON public.moodle_exams
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 6. TABLA DE SESIONES DE AUSCULTACIÓN CLÍNICA (TRACKING)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.auscultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    focus_id TEXT NOT NULL,
    layer TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.auscultation_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para sesiones de auscultación
CREATE POLICY "auscultation_sessions_select_policy" ON public.auscultation_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "auscultation_sessions_insert_policy" ON public.auscultation_sessions
    FOR INSERT WITH CHECK (true);

