-- ============================================================================
-- MIGRACIÓN: pgvector y Analíticas Estudiantiles para "Study With Me"
-- Base de Datos: Supabase PostgreSQL (esquema public)
-- Fecha: 5 de Junio de 2026
-- ============================================================================

-- Habilitar la extensión pgvector si no está instalada
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================
-- 1. TABLA DE EMBEDDINGS ACADÉMICOS (RAG)
-- ==========================================
-- Almacena fragmentos y embeddings de libros, apuntes y syllabus oficiales.
CREATE TABLE IF NOT EXISTS public.academic_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_name TEXT NOT NULL,         -- 'Argente', 'Bates (Bickley)', 'Llanio', 'Syllabus', etc.
    chapter TEXT,                    -- Capítulo o módulo correspondiente
    content TEXT NOT NULL,           -- Contenido textual del fragmento (chunk)
    embedding VECTOR(1536),          -- Embedding vectorial de 1536 dimensiones (OpenAI/Gemini standard)
    metadata JSONB DEFAULT '{}'::jsonb, -- Campos adicionales (semana, bloque, competencias CG)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABLA DE ANALÍTICAS DE ESTUDIANTES
-- ==========================================
-- Mantiene el progreso y rendimiento adaptativo por cada materia y alumno.
CREATE TABLE IF NOT EXISTS public.student_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_code TEXT NOT NULL,       -- MED-228, FAR-301, etc.
    completed_assignments INTEGER DEFAULT 0 NOT NULL,
    average_score NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_code)
);

-- Trigger para mantener actualizado updated_at automáticamente
CREATE OR REPLACE TRIGGER student_analytics_updated_at
  BEFORE UPDATE ON public.student_analytics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ÍNDICES DE BASE DE DATOS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_student_analytics_user ON public.student_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_embeddings_book ON public.academic_embeddings(book_name);

-- Índice de vectores HNSW para búsquedas semánticas rápidas (usando similitud de coseno)
CREATE INDEX IF NOT EXISTS idx_academic_embeddings_vector 
ON public.academic_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- SEGURIDAD A NIVEL DE FILA (Row-Level Security - RLS)
-- ============================================================================
ALTER TABLE public.academic_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para los embeddings de la cátedra (Lectura pública para usuarios autenticados)
CREATE POLICY "academic_embeddings_select_auth" ON public.academic_embeddings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para analíticas de estudiantes (Acceso y escritura solo para el dueño)
CREATE POLICY "student_analytics_owner_select" ON public.student_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "student_analytics_owner_insert" ON public.student_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_analytics_owner_update" ON public.student_analytics
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
