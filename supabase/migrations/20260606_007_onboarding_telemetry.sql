-- ============================================
-- MIGRATION: 007_onboarding_telemetry
-- Description: Onboarding telemetry table and RLS policies
-- Rollback:
--   DROP TABLE IF EXISTS public.onboarding_telemetry CASCADE;
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.onboarding_telemetry (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES public.students(id) ON DELETE CASCADE,
  step_name     TEXT NOT NULL,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  score         INTEGER,
  ease_factor   NUMERIC(3,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.onboarding_telemetry ENABLE ROW LEVEL SECURITY;

-- Política de RLS: los estudiantes solo pueden acceder a sus propios registros de telemetría
CREATE POLICY telemetry_self_access ON public.onboarding_telemetry
  FOR ALL USING (
    student_id IN (
      SELECT id FROM public.students WHERE auth_id = auth.uid()
    )
  );

COMMIT;
