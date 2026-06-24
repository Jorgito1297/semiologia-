-- SCHEMA UNIFICADO ANTIGRAVITY 2.0 - MED-228 (UCE)
-- Configuración completa para Supabase con soporte para RAG y Neuro-Adaptatividad.

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TIPOS ENUMERADOS (DOMINIO MÉDICO Y ACADÉMICO)
DO $$ BEGIN
    CREATE TYPE public.content_type AS ENUM ('theoretical', 'procedural');
    CREATE TYPE public.memory_domain AS ENUM ('semantic', 'procedural', 'executive', 'perceptual');
    CREATE TYPE public.evaluation_type AS ENUM ('quiz', 'osce', 'simulation', 'practical_exam');
    CREATE TYPE public.block_type AS ENUM ('block_1', 'block_2', 'block_3', 'final');
    CREATE TYPE public.cg_competency AS ENUM ('CG1', 'CG2', 'CG6', 'CG7', 'CG8', 'CG11');
    CREATE TYPE public.user_role AS ENUM ('student', 'faculty', 'validator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ESTRUCTURA ACADÉMICA BASE
CREATE TABLE IF NOT EXISTS public.courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,          -- Ej: 'MED-228'
  name            TEXT NOT NULL,
  credits         INTEGER DEFAULT 3,
  weekly_hours_theory    INTEGER DEFAULT 2,
  weekly_hours_practical INTEGER DEFAULT 3,
  institution     TEXT NOT NULL DEFAULT 'UCE',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ESTUDIANTES Y SEGUIMIENTO NEURO-COGNITIVO
CREATE TABLE IF NOT EXISTS public.students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id             UUID UNIQUE,               -- Referencia a auth.users de Supabase
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  course_id           UUID REFERENCES public.courses(id),
  role                public.user_role NOT NULL DEFAULT 'student',
  cohort              TEXT DEFAULT '2026-A',
  completed_med224    BOOLEAN NOT NULL DEFAULT true,
  last_active         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTENT CHUNKS (NÚCLEO DEL RAG)
CREATE TABLE IF NOT EXISTS public.content_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  week            INTEGER NOT NULL CHECK (week BETWEEN 1 AND 16),
  block           public.block_type NOT NULL,
  topic           TEXT NOT NULL,
  subtopic        TEXT,
  content_type    public.content_type NOT NULL,
  memory_domain   public.memory_domain NOT NULL,
  cg_competencies public.cg_competency[] NOT NULL,
  evaluation_type public.evaluation_type[],
  chunk_text      TEXT NOT NULL,
  source_book     TEXT NOT NULL,                 -- Ej: 'Llanio Tomo I'
  source_chapter  TEXT,
  source_pages    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  embedding       vector(1536),                  -- Vector de Gemini/Ollama
  chunk_index     INTEGER,
  token_count     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEMORIA ESTUDIANTIL (ALGORITMO DE REPETICIÓN ESPACIADA)
CREATE TABLE IF NOT EXISTS public.student_memory_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES public.students(id) ON DELETE CASCADE,
  chunk_id        UUID REFERENCES public.content_chunks(id) ON DELETE CASCADE,
  memory_domain   public.memory_domain NOT NULL,
  accuracy_pct    NUMERIC(5,2) DEFAULT 0,        -- Desempeño en simulaciones (0-100)
  response_time_s NUMERIC(6,2),
  memory_decay_score   NUMERIC(5,4) DEFAULT 1.0,
  review_count         INTEGER DEFAULT 0,
  next_review_at       TIMESTAMPTZ,
  interval_days        INTEGER DEFAULT 1,
  ease_factor          NUMERIC(4,2) DEFAULT 2.5, -- Factor de dificultad adaptativo
  last_reviewed_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, chunk_id, memory_domain),
  CONSTRAINT check_ease_factor CHECK (ease_factor BETWEEN 1.3 AND 5.0)
);


-- 7. FUNCIÓN DE BÚSQUEDA VECTORIAL (RPC)
-- Esta función permite al Paciente Virtual buscar contexto médico rápidamente
CREATE OR REPLACE FUNCTION public.match_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  source_book text,
  source_chapter text,
  source_pages text,
  topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    content_chunks.id,
    content_chunks.chunk_text,
    content_chunks.source_book,
    content_chunks.source_chapter,
    content_chunks.source_pages,
    content_chunks.topic,
    1 - (content_chunks.embedding <=> query_embedding) AS similarity
  FROM public.content_chunks
  WHERE 1 - (content_chunks.embedding <=> query_embedding) > match_threshold
  AND is_active = true
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 8. ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding 
ON public.content_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_topic ON public.content_chunks(topic);
CREATE INDEX IF NOT EXISTS idx_memory_student_lookup ON public.student_memory_states(student_id, next_review_at);

-- 10. DATOS SEMILLA PARA MED-228
INSERT INTO public.courses (code, name, credits, weekly_hours_theory, weekly_hours_practical, period)
VALUES (
  'MED-228',
  'Propedéutica Clínica y Semiología Médica',
  3, 2, 3,
  'MAY-AGO 2026'
) ON CONFLICT (code) DO NOTHING;
-- 11. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_memory_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can see their own profile" ON public.students
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Active content is public for authenticated users" ON public.content_chunks
  FOR SELECT USING (is_active = true);